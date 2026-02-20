import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; coId: string } }
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

    // Load change order
    const { data: changeOrder, error: coError } = await admin
      .from("invoice_change_orders")
      .select("*")
      .eq("id", params.coId)
      .eq("invoice_id", params.id)
      .single()

    if (coError || !changeOrder) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 })
    }

    if (changeOrder.status !== "pending") {
      return NextResponse.json(
        { error: `Change order is already ${changeOrder.status}` },
        { status: 400 }
      )
    }

    // Verify membership with admin role
    const { data: membership } = await admin
      .from("user_roles")
      .select("id, role:roles(name)")
      .eq("user_id", user.id)
      .eq("business_id", changeOrder.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const roleName = (membership.role as any)?.name
    if (!["Owner", "Admin"].includes(roleName)) {
      return NextResponse.json({ error: "Only admins can approve change orders" }, { status: 403 })
    }

    // Load invoice
    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("id, subtotal, tax_rate, tax_amount, total, amount_paid, amount_due, status")
      .eq("id", params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (["paid", "void"].includes(invoice.status)) {
      return NextResponse.json(
        { error: `Cannot approve change orders on a ${invoice.status} invoice` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Approve change order
    const { error: approveError } = await admin
      .from("invoice_change_orders")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: now,
      })
      .eq("id", params.coId)

    if (approveError) {
      console.error("Approve change order error:", approveError)
      return NextResponse.json({ error: "Failed to approve change order" }, { status: 500 })
    }

    // Add line item for the change order
    const { data: existingItems } = await admin
      .from("invoice_line_items")
      .select("sort_order")
      .eq("invoice_id", params.id)
      .order("sort_order", { ascending: false })
      .limit(1)

    const nextSortOrder = ((existingItems?.[0]?.sort_order || 0) + 1)

    await admin.from("invoice_line_items").insert({
      invoice_id: params.id,
      description: `Change Order #${changeOrder.change_order_number}: ${changeOrder.title}`,
      quantity: 1,
      unit_price: changeOrder.amount,
      amount: changeOrder.amount,
      sort_order: nextSortOrder,
    })

    // Recalculate totals
    const newSubtotal = parseFloat((parseFloat(invoice.subtotal) + parseFloat(changeOrder.amount)).toFixed(2))
    const taxRate = parseFloat(invoice.tax_rate)
    const newTaxAmount = parseFloat((newSubtotal * taxRate / 100).toFixed(2))
    const newTotal = parseFloat((newSubtotal + newTaxAmount).toFixed(2))
    const newAmountDue = parseFloat((newTotal - parseFloat(invoice.amount_paid)).toFixed(2))

    const { error: updateError } = await admin
      .from("invoices")
      .update({
        subtotal: newSubtotal,
        tax_amount: newTaxAmount,
        total: newTotal,
        amount_due: newAmountDue,
        updated_at: now,
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("Recalculate invoice error:", updateError)
      return NextResponse.json({ error: "Failed to recalculate invoice totals" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      newSubtotal,
      newTotal,
      newAmountDue,
    })
  } catch (err: any) {
    console.error("Approve change order API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
