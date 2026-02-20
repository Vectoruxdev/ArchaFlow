import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendPaymentReceivedEmail } from "@/lib/email"

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
      .select("*, client:clients(id, name, email)")
      .eq("id", params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Can't pay void or already fully paid invoices
    if (invoice.status === "void") {
      return NextResponse.json({ error: "Cannot record payment on a voided invoice" }, { status: 400 })
    }
    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice is already fully paid" }, { status: 400 })
    }
    if (invoice.status === "draft") {
      return NextResponse.json({ error: "Cannot record payment on a draft invoice" }, { status: 400 })
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
    const { amount, paymentMethod, referenceNumber, notes, paymentDate } = body

    const paymentAmount = parseFloat(amount)
    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: "Payment amount must be positive" }, { status: 400 })
    }

    const currentAmountDue = parseFloat(invoice.amount_due)
    if (paymentAmount > currentAmountDue) {
      return NextResponse.json(
        { error: `Payment amount ($${paymentAmount.toFixed(2)}) exceeds amount due ($${currentAmountDue.toFixed(2)})` },
        { status: 400 }
      )
    }

    // Record payment
    const { error: paymentError } = await admin
      .from("invoice_payments")
      .insert({
        invoice_id: params.id,
        business_id: invoice.business_id,
        amount: paymentAmount,
        payment_method: paymentMethod || "other",
        reference_number: referenceNumber || null,
        notes: notes || null,
        payment_date: paymentDate || new Date().toISOString().split("T")[0],
        recorded_by: user.id,
      })

    if (paymentError) {
      console.error("Record payment error:", paymentError)
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    // Update invoice totals
    const newAmountPaid = parseFloat((parseFloat(invoice.amount_paid) + paymentAmount).toFixed(2))
    const newAmountDue = parseFloat((parseFloat(invoice.total) - newAmountPaid).toFixed(2))

    const invoiceUpdates: Record<string, any> = {
      amount_paid: newAmountPaid,
      amount_due: newAmountDue,
      updated_at: new Date().toISOString(),
    }

    if (newAmountDue <= 0) {
      invoiceUpdates.status = "paid"
      invoiceUpdates.paid_at = new Date().toISOString()
    } else if (["sent", "viewed", "overdue"].includes(invoice.status)) {
      invoiceUpdates.status = "partially_paid"
    }

    const { error: updateError } = await admin
      .from("invoices")
      .update(invoiceUpdates)
      .eq("id", params.id)

    if (updateError) {
      console.error("Update invoice after payment error:", updateError)
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }

    // Send payment confirmation email to client
    const clientEmail = (invoice.client as any)?.email
    const clientName = (invoice.client as any)?.name
    if (clientEmail) {
      // Get business name
      const { data: businessData } = await admin
        .from("businesses")
        .select("name")
        .eq("id", invoice.business_id)
        .single()

      try {
        await sendPaymentReceivedEmail({
          to: clientEmail,
          recipientName: clientName || "Client",
          businessName: businessData?.name || "Your service provider",
          invoiceNumber: invoice.invoice_number,
          paymentAmount: `$${paymentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          remainingBalance: `$${Math.max(0, newAmountDue).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        })
      } catch (emailErr) {
        console.error("Payment email error:", emailErr)
      }
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: invoice.business_id,
        user_id: user.id,
        activity_type: "invoice_paid",
        entity_type: "invoice",
        entity_id: invoice.id,
        message: `Recorded $${paymentAmount.toFixed(2)} payment on invoice ${invoice.invoice_number}`,
        metadata: { amount: paymentAmount, newStatus: invoiceUpdates.status || invoice.status },
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      status: invoiceUpdates.status || invoice.status,
    })
  } catch (err: any) {
    console.error("Record payment API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
