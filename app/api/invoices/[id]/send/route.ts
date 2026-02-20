import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendInvoiceEmail } from "@/lib/email"

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
      .select("*, client:clients(id, first_name, last_name, email)")
      .eq("id", params.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (!["draft", "sent"].includes(invoice.status)) {
      return NextResponse.json(
        { error: `Cannot send a ${invoice.status} invoice` },
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

    const body = await request.json().catch(() => ({}))
    const recipientEmail = body.email || (invoice.client as any)?.email
    const recipientName = body.recipientName || (invoice.client as any)?.name || "Client"

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No recipient email. Provide email in request or set client email." },
        { status: 400 }
      )
    }

    // Generate viewing token
    const viewingToken = crypto.randomUUID()
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 90) // 90-day expiry for invoices

    const now = new Date().toISOString()

    const { error: updateError } = await admin
      .from("invoices")
      .update({
        status: "sent",
        viewing_token: viewingToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        sent_at: now,
        updated_at: now,
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("Send invoice update error:", updateError)
      return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
    }

    // Get business name for email
    const { data: businessData } = await admin
      .from("businesses")
      .select("name")
      .eq("id", invoice.business_id)
      .single()

    const businessName = businessData?.name || "Your service provider"

    // Send email
    let emailWarning: string | null = null
    try {
      await sendInvoiceEmail({
        to: recipientEmail,
        recipientName,
        businessName,
        invoiceNumber: invoice.invoice_number,
        amount: `$${parseFloat(invoice.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        dueDate: invoice.due_date
          ? new Date(invoice.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Upon receipt",
        viewingToken,
      })
    } catch (emailErr: any) {
      console.error("Invoice email error:", emailErr)
      emailWarning = emailErr.message || "Failed to send email"
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: invoice.business_id,
        user_id: user.id,
        activity_type: "invoice_sent",
        entity_type: "invoice",
        entity_id: invoice.id,
        message: `Sent invoice ${invoice.invoice_number} to ${recipientName}`,
        metadata: { recipientEmail },
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true, viewingToken, emailWarning })
  } catch (err: any) {
    console.error("Send invoice API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
