import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { canCreateInvoice } from "@/lib/billing/feature-gates"
import type { PlanTier } from "@/lib/stripe/config"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = request.nextUrl.searchParams
    const businessId = params.get("businessId")
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build query
    let query = admin
      .from("invoices")
      .select("*, client:clients(id, first_name, last_name, email), project:projects(id, name)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    // Filters
    const status = params.get("status")
    if (status) query = query.eq("status", status)

    const clientId = params.get("clientId")
    if (clientId) query = query.eq("client_id", clientId)

    const projectId = params.get("projectId")
    if (projectId) query = query.eq("project_id", projectId)

    const dateFrom = params.get("dateFrom")
    if (dateFrom) query = query.gte("issue_date", dateFrom)

    const dateTo = params.get("dateTo")
    if (dateTo) query = query.lte("issue_date", dateTo)

    // Check overdue: update any sent/viewed invoices past due date
    const now = new Date().toISOString().split("T")[0]
    await admin
      .from("invoices")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("business_id", businessId)
      .in("status", ["sent", "viewed"])
      .lt("due_date", now)

    const { data: invoices, error: queryError } = await query

    if (queryError) {
      console.error("List invoices error:", queryError)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json(invoices)
  } catch (err: any) {
    console.error("List invoices API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { businessId, clientId, projectId, lineItems, issueDate, dueDate, paymentTerms, notes, internalNotes, taxRate } = body

    if (!businessId || !lineItems?.length) {
      return NextResponse.json({ error: "Missing required fields (businessId, lineItems)" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check feature gate
    const { data: business } = await admin
      .from("businesses")
      .select("plan_tier")
      .eq("id", businessId)
      .single()

    const tier = (business?.plan_tier || "free") as PlanTier

    // Count invoices created this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await admin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", startOfMonth.toISOString())

    if (!canCreateInvoice(tier, count || 0)) {
      return NextResponse.json(
        { error: "Invoice limit reached for your plan. Upgrade to create more invoices." },
        { status: 403 }
      )
    }

    // Get/create invoice settings and atomically increment invoice number
    let { data: settings } = await admin
      .from("invoice_settings")
      .select("*")
      .eq("business_id", businessId)
      .single()

    if (!settings) {
      const { data: newSettings } = await admin
        .from("invoice_settings")
        .insert({ business_id: businessId })
        .select("*")
        .single()
      settings = newSettings
    }

    // Atomic increment
    const { data: updatedSettings } = await admin
      .from("invoice_settings")
      .update({ next_invoice_number: (settings?.next_invoice_number || 1) + 1, updated_at: new Date().toISOString() })
      .eq("business_id", businessId)
      .select("next_invoice_number")
      .single()

    const invoiceNum = settings?.next_invoice_number || 1
    const invoiceNumber = `INV-${String(invoiceNum).padStart(4, "0")}`

    // Calculate totals
    const effectiveTaxRate = taxRate ?? settings?.default_tax_rate ?? 0
    let subtotal = 0
    const processedItems = lineItems.map((item: any, idx: number) => {
      const qty = parseFloat(item.quantity) || 1
      const price = parseFloat(item.unitPrice) || 0
      const amount = parseFloat((qty * price).toFixed(2))
      subtotal += amount
      return {
        description: item.description,
        quantity: qty,
        unit_price: price,
        amount,
        sort_order: idx,
      }
    })

    subtotal = parseFloat(subtotal.toFixed(2))
    const taxAmount = parseFloat((subtotal * effectiveTaxRate / 100).toFixed(2))
    const total = parseFloat((subtotal + taxAmount).toFixed(2))

    // Create invoice
    const { data: invoice, error: insertError } = await admin
      .from("invoices")
      .insert({
        business_id: businessId,
        project_id: projectId || null,
        client_id: clientId || null,
        invoice_number: invoiceNumber,
        status: "draft",
        subtotal,
        tax_rate: effectiveTaxRate,
        tax_amount: taxAmount,
        total,
        amount_paid: 0,
        amount_due: total,
        issue_date: issueDate || new Date().toISOString().split("T")[0],
        due_date: dueDate || null,
        payment_terms: paymentTerms || settings?.default_payment_terms || "Net 30",
        notes: notes || null,
        internal_notes: internalNotes || null,
        created_by: user.id,
      })
      .select("id, invoice_number")
      .single()

    if (insertError) {
      console.error("Create invoice error:", insertError)
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
    }

    // Insert line items
    const itemRows = processedItems.map((item: any) => ({
      invoice_id: invoice.id,
      ...item,
    }))

    const { error: itemsError } = await admin
      .from("invoice_line_items")
      .insert(itemRows)

    if (itemsError) {
      console.error("Create line items error:", itemsError)
      // Clean up invoice
      await admin.from("invoices").delete().eq("id", invoice.id)
      return NextResponse.json({ error: "Failed to create line items" }, { status: 500 })
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: businessId,
        user_id: user.id,
        activity_type: "invoice_created",
        entity_type: "invoice",
        entity_id: invoice.id,
        message: `Created invoice ${invoiceNumber}`,
        metadata: { total },
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (err: any) {
    console.error("Create invoice API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
