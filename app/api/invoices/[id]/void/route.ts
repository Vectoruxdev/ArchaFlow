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

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id, role:roles(name)")
      .eq("user_id", user.id)
      .eq("business_id", invoice.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const roleName = (membership.role as any)?.name
    if (!["Owner", "Admin"].includes(roleName)) {
      return NextResponse.json({ error: "Only admins can void invoices" }, { status: 403 })
    }

    // Can't void already void or paid invoices
    if (invoice.status === "void") {
      return NextResponse.json({ error: "Invoice is already voided" }, { status: 400 })
    }
    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Cannot void a paid invoice" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reason = body.reason || ""

    const now = new Date().toISOString()
    const { error: updateError } = await admin
      .from("invoices")
      .update({
        status: "void",
        voided_at: now,
        internal_notes: invoice.status !== "draft"
          ? `Voided: ${reason}`
          : null,
        updated_at: now,
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("Void invoice error:", updateError)
      return NextResponse.json({ error: "Failed to void invoice" }, { status: 500 })
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: invoice.business_id,
        user_id: user.id,
        activity_type: "invoice_voided",
        entity_type: "invoice",
        entity_id: invoice.id,
        message: `Voided invoice ${invoice.invoice_number}`,
        metadata: { reason },
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Void invoice API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
