import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(
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

    // Load invoice
    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("id, business_id, status, invoice_number")
      .eq("id", params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Can't add change orders to paid or void invoices
    if (["paid", "void"].includes(invoice.status)) {
      return NextResponse.json(
        { error: `Cannot add change orders to a ${invoice.status} invoice` },
        { status: 400 }
      )
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
    const { title, description, amount } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const changeAmount = parseFloat(amount)
    if (isNaN(changeAmount)) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 })
    }

    // Get next change order number
    const { count } = await admin
      .from("invoice_change_orders")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", params.id)

    const { data: changeOrder, error: insertError } = await admin
      .from("invoice_change_orders")
      .insert({
        invoice_id: params.id,
        business_id: invoice.business_id,
        change_order_number: (count || 0) + 1,
        title: title.trim(),
        description: description?.trim() || null,
        amount: changeAmount,
        status: "pending",
        created_by: user.id,
      })
      .select("*")
      .single()

    if (insertError) {
      console.error("Create change order error:", insertError)
      return NextResponse.json({ error: "Failed to create change order" }, { status: 500 })
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: invoice.business_id,
        user_id: user.id,
        activity_type: "change_order_created",
        entity_type: "invoice",
        entity_id: invoice.id,
        message: `Created change order "${title.trim()}" (${changeAmount >= 0 ? "+" : ""}$${changeAmount.toFixed(2)}) on invoice ${invoice.invoice_number}`,
        metadata: { changeOrderId: changeOrder.id, amount: changeAmount },
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json(changeOrder, { status: 201 })
  } catch (err: any) {
    console.error("Create change order API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
