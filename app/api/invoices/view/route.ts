import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Public route — no auth required, uses viewing token
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Load invoice by viewing token
    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("*, client:clients(id, name, email, company_name, phone)")
      .eq("viewing_token", token)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invalid or expired invoice link" },
        { status: 404 }
      )
    }

    // Check token expiry
    if (
      invoice.status !== "paid" &&
      invoice.token_expires_at &&
      new Date(invoice.token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "This invoice link has expired" },
        { status: 400 }
      )
    }

    // Mark as viewed if currently sent
    if (invoice.status === "sent") {
      await admin
        .from("invoices")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("viewing_token", token)
    }

    // Get line items, payments, change orders
    const [lineItemsRes, paymentsRes, changeOrdersRes] = await Promise.all([
      admin
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("sort_order", { ascending: true }),
      admin
        .from("invoice_payments")
        .select("id, amount, payment_method, payment_date")
        .eq("invoice_id", invoice.id)
        .order("payment_date", { ascending: false }),
      admin
        .from("invoice_change_orders")
        .select("id, change_order_number, title, description, amount, status, created_at")
        .eq("invoice_id", invoice.id)
        .eq("status", "approved")
        .order("created_at", { ascending: true }),
    ])

    // Get business info (invoice settings)
    const { data: settings } = await admin
      .from("invoice_settings")
      .select("company_name, company_address, company_phone, company_email, footer_text")
      .eq("business_id", invoice.business_id)
      .single()

    // Get business name fallback
    const { data: businessData } = await admin
      .from("businesses")
      .select("name")
      .eq("id", invoice.business_id)
      .single()

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxRate: invoice.tax_rate,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      paymentTerms: invoice.payment_terms,
      notes: invoice.notes,
      client: invoice.client,
      lineItems: lineItemsRes.data || [],
      payments: paymentsRes.data || [],
      changeOrders: changeOrdersRes.data || [],
      business: {
        name: settings?.company_name || businessData?.name || "",
        address: settings?.company_address || "",
        phone: settings?.company_phone || "",
        email: settings?.company_email || "",
        footerText: settings?.footer_text || "",
      },
    })
  } catch (err: any) {
    console.error("Public invoice view error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
