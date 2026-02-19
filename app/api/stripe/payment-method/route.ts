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

    // Get Stripe customer ID
    const { data: business } = await admin
      .from("businesses")
      .select("stripe_customer_id")
      .eq("id", businessId)
      .single()

    if (!business?.stripe_customer_id) {
      return NextResponse.json({ paymentMethod: null })
    }

    const stripe = getStripe()

    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(
      business.stripe_customer_id
    )

    if (customer.deleted) {
      return NextResponse.json({ paymentMethod: null })
    }

    const defaultPmId =
      typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings?.default_payment_method?.id

    if (!defaultPmId) {
      return NextResponse.json({ paymentMethod: null })
    }

    const pm = await stripe.paymentMethods.retrieve(defaultPmId)

    return NextResponse.json({
      paymentMethod: {
        brand: pm.card?.brand || "unknown",
        last4: pm.card?.last4 || "****",
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      },
    })
  } catch (err: any) {
    console.error("[payment-method] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
