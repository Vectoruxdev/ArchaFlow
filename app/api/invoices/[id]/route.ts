import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Get invoice (no JOINs)
    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("*")
      .eq("id", params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", invoice.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get line items, payments, change orders, client, project in parallel
    const [lineItemsRes, paymentsRes, changeOrdersRes, clientRes, projectRes] = await Promise.all([
      admin
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", params.id)
        .order("sort_order", { ascending: true }),
      admin
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", params.id)
        .order("payment_date", { ascending: false }),
      admin
        .from("invoice_change_orders")
        .select("*")
        .eq("invoice_id", params.id)
        .order("created_at", { ascending: false }),
      invoice.client_id
        ? admin.from("clients").select("id, first_name, last_name, email, phone").eq("id", invoice.client_id).single()
        : Promise.resolve({ data: null }),
      invoice.project_id
        ? admin.from("projects").select("id, title").eq("id", invoice.project_id).single()
        : Promise.resolve({ data: null }),
    ])

    return NextResponse.json({
      ...invoice,
      client: clientRes.data || null,
      project: projectRes.data || null,
      line_items: lineItemsRes.data || [],
      payments: paymentsRes.data || [],
      change_orders: changeOrdersRes.data || [],
    })
  } catch (err: any) {
    console.error("Get invoice error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Get invoice
    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("id, business_id, status")
      .eq("id", params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status !== "draft") {
      return NextResponse.json({ error: "Only draft invoices can be edited" }, { status: 400 })
    }

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", invoice.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { lineItems, issueDate, dueDate, paymentTerms, notes, internalNotes, taxRate, clientId, projectId } = body

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (issueDate !== undefined) updates.issue_date = issueDate
    if (dueDate !== undefined) updates.due_date = dueDate
    if (paymentTerms !== undefined) updates.payment_terms = paymentTerms
    if (notes !== undefined) updates.notes = notes
    if (internalNotes !== undefined) updates.internal_notes = internalNotes
    if (taxRate !== undefined) updates.tax_rate = taxRate
    if (clientId !== undefined) updates.client_id = clientId || null
    if (projectId !== undefined) updates.project_id = projectId || null

    // If line items provided, replace them and recalculate
    if (lineItems?.length) {
      // Delete existing
      await admin.from("invoice_line_items").delete().eq("invoice_id", params.id)

      let subtotal = 0
      const itemRows = lineItems.map((item: any, idx: number) => {
        const qty = parseFloat(item.quantity) || 1
        const price = parseFloat(item.unitPrice || item.unit_price) || 0
        const amount = parseFloat((qty * price).toFixed(2))
        subtotal += amount
        return {
          invoice_id: params.id,
          description: item.description,
          quantity: qty,
          unit_price: price,
          amount,
          sort_order: idx,
        }
      })

      await admin.from("invoice_line_items").insert(itemRows)

      subtotal = parseFloat(subtotal.toFixed(2))
      const effectiveTaxRate = taxRate ?? updates.tax_rate ?? 0
      const taxAmount = parseFloat((subtotal * effectiveTaxRate / 100).toFixed(2))
      const total = parseFloat((subtotal + taxAmount).toFixed(2))

      updates.subtotal = subtotal
      updates.tax_amount = taxAmount
      updates.total = total
      updates.amount_due = total
    } else if (taxRate !== undefined) {
      // Recalculate with new tax rate using existing subtotal
      const { data: current } = await admin
        .from("invoices")
        .select("subtotal, amount_paid")
        .eq("id", params.id)
        .single()

      if (current) {
        const taxAmount = parseFloat((current.subtotal * taxRate / 100).toFixed(2))
        const total = parseFloat((current.subtotal + taxAmount).toFixed(2))
        updates.tax_amount = taxAmount
        updates.total = total
        updates.amount_due = parseFloat((total - current.amount_paid).toFixed(2))
      }
    }

    const { data: updated, error: updateError } = await admin
      .from("invoices")
      .update(updates)
      .eq("id", params.id)
      .select("*")
      .single()

    if (updateError) {
      console.error("Update invoice error:", updateError)
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("Update invoice API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("id, business_id, status, invoice_number")
      .eq("id", params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status !== "draft") {
      return NextResponse.json({ error: "Only draft invoices can be deleted" }, { status: 400 })
    }

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", invoice.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete (cascade handles line items)
    const { error: deleteError } = await admin
      .from("invoices")
      .delete()
      .eq("id", params.id)

    if (deleteError) {
      console.error("Delete invoice error:", deleteError)
      return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Delete invoice API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
