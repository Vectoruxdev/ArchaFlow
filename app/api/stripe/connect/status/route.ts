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
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: business } = await admin
      .from("businesses")
      .select("stripe_connect_account_id, stripe_connect_onboarding_complete, online_payments_enabled")
      .eq("id", businessId)
      .single()

    if (!business || !business.stripe_connect_account_id) {
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboardingComplete: false,
        paymentsEnabled: false,
      })
    }

    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(business.stripe_connect_account_id)

    // Update onboarding status if it changed
    if (account.charges_enabled !== business.stripe_connect_onboarding_complete) {
      await admin
        .from("businesses")
        .update({ stripe_connect_onboarding_complete: account.charges_enabled })
        .eq("id", businessId)
    }

    return NextResponse.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      onboardingComplete: account.charges_enabled,
      paymentsEnabled: business.online_payments_enabled,
    })
  } catch (err: any) {
    console.error("[connect/status] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
