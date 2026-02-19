import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"

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

    const businessId = request.nextUrl.searchParams.get("businessId")
    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Verify caller belongs to this workspace
    const { data: callerRole } = await admin
      .from("user_roles")
      .select("role_id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!callerRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get Stripe customer ID and subscription ID
    const { data: business } = await admin
      .from("businesses")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("id", businessId)
      .single()

    if (!business?.stripe_customer_id) {
      return NextResponse.json({ invoices: [], subscription: null })
    }

    const stripe = getStripe()

    // Fetch recent invoices
    const invoiceList = await stripe.invoices.list({
      customer: business.stripe_customer_id,
      limit: 10,
    })

    const invoices = invoiceList.data.map((inv) => ({
      id: inv.id,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      invoicePdf: inv.invoice_pdf,
    }))

    // Fetch subscription details for next billing date
    let subscription = null
    if (business.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(
          business.stripe_subscription_id
        )
        subscription = {
          currentPeriodEnd: (sub as any).current_period_end
            ? new Date((sub as any).current_period_end * 1000).toISOString()
            : null,
          status: sub.status,
        }
      } catch {
        // Subscription may have been deleted
      }
    }

    return NextResponse.json({ invoices, subscription })
  } catch (err: any) {
    console.error("[invoices] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
