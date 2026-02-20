import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import { canAcceptOnlinePayments } from "@/lib/billing/feature-gates"
import type { PlanTier } from "@/lib/stripe/config"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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
    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
    }

    // Verify user is Owner
    const { data: role } = await admin
      .from("user_roles")
      .select("role:roles(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    const roleName = (role?.role as any)?.name
    if (!["Owner"].includes(roleName)) {
      return NextResponse.json({ error: "Only owners can connect Stripe" }, { status: 403 })
    }

    // Check plan tier
    const { data: business } = await admin
      .from("businesses")
      .select("plan_tier, stripe_connect_account_id")
      .eq("id", businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    if (!canAcceptOnlinePayments(business.plan_tier as PlanTier)) {
      return NextResponse.json(
        { error: "Upgrade to Pro to accept online payments" },
        { status: 403 }
      )
    }

    const stripe = getStripe()
    let connectAccountId = business.stripe_connect_account_id

    // Create Express account if none exists
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { business_id: businessId },
      })
      connectAccountId = account.id

      await admin
        .from("businesses")
        .update({ stripe_connect_account_id: connectAccountId })
        .eq("id", businessId)
    }

    // Create Account Link for onboarding
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: `${siteUrl}/settings/billing`,
      return_url: `${siteUrl}/settings/billing`,
      type: "account_onboarding",
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    console.error("[connect/onboard] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
