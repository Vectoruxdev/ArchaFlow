import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import { canAcceptOnlinePayments } from "@/lib/billing/feature-gates"
import type { PlanTier } from "@/lib/stripe/config"

export const dynamic = "force-dynamic"

// Public route — no auth required, uses viewing token
export async function POST(request: NextRequest) {
  try {
    const { token, amount } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Load invoice by viewing token
    const { data: invoice, error: invoiceError } = await admin
      .from("invoices")
      .select("id, invoice_number, business_id, status, amount_due, viewing_token, token_expires_at")
      .eq("viewing_token", token)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invalid invoice link" }, { status: 404 })
    }

    // Check token expiry
    if (invoice.token_expires_at && new Date(invoice.token_expires_at) < new Date()) {
      return NextResponse.json({ error: "This invoice link has expired" }, { status: 400 })
    }

    // Check invoice is payable
    const payableStatuses = ["sent", "viewed", "overdue", "partially_paid"]
    if (!payableStatuses.includes(invoice.status)) {
      return NextResponse.json(
        { error: `Cannot pay a ${invoice.status} invoice` },
        { status: 400 }
      )
    }

    // Validate amount against amount_due
    const amountDue = parseFloat(invoice.amount_due)
    if (amount > amountDue) {
      return NextResponse.json(
        { error: `Amount exceeds balance due of $${amountDue.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Check business has online payments enabled
    const { data: business } = await admin
      .from("businesses")
      .select("plan_tier, stripe_connect_account_id, stripe_connect_onboarding_complete, online_payments_enabled")
      .eq("id", invoice.business_id)
      .single()

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    if (
      !business.online_payments_enabled ||
      !business.stripe_connect_onboarding_complete ||
      !business.stripe_connect_account_id ||
      !canAcceptOnlinePayments(business.plan_tier as PlanTier)
    ) {
      return NextResponse.json(
        { error: "Online payments are not available for this invoice" },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Verify connected account can accept charges
    const account = await stripe.accounts.retrieve(business.stripe_connect_account_id)
    if (!account.charges_enabled) {
      return NextResponse.json(
        { error: "The business's payment account is not ready" },
        { status: 400 }
      )
    }

    // Create PaymentIntent with transfer to connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      application_fee_amount: 50, // $0.50 flat platform fee
      transfer_data: {
        destination: business.stripe_connect_account_id,
      },
      metadata: {
        invoice_id: invoice.id,
        business_id: invoice.business_id,
        invoice_number: invoice.invoice_number,
        viewing_token: token,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
    })
  } catch (err: any) {
    console.error("[invoices/pay] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
