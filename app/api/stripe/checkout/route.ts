import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import {
  PLAN_CONFIGS,
  getPriceIdsForTier,
  getFoundingCouponId,
  type PlanTier,
} from "@/lib/stripe/config"

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

    const { businessId, planTier } = (await request.json()) as {
      businessId: string
      planTier: PlanTier
    }

    if (!businessId || !planTier || !["pro", "enterprise"].includes(planTier)) {
      return NextResponse.json(
        { error: "businessId and planTier (pro or enterprise) are required" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Verify caller is workspace owner
    const { data: callerRole } = await admin
      .from("user_roles")
      .select("role_id, roles:role_id(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    const roleName = (callerRole as any)?.roles?.name
    if (roleName !== "Owner") {
      return NextResponse.json(
        { error: "Only workspace owners can manage billing" },
        { status: 403 }
      )
    }

    const stripe = getStripe()

    // Get or create Stripe customer
    const { data: business } = await admin
      .from("businesses")
      .select("stripe_customer_id, name")
      .eq("id", businessId)
      .single()

    let customerId = business?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: business?.name || undefined,
        metadata: { business_id: businessId, user_id: user.id },
      })
      customerId = customer.id

      await admin
        .from("businesses")
        .update({ stripe_customer_id: customerId })
        .eq("id", businessId)
    }

    // Count current seats
    const { count: seatCount } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)

    const config = PLAN_CONFIGS[planTier]
    const currentSeats = seatCount || 1
    const extraSeats = Math.max(0, currentSeats - config.includedSeats)

    // Build line items
    const priceIds = getPriceIdsForTier(planTier)
    if (!priceIds) {
      return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 })
    }

    const lineItems: { price: string; quantity: number }[] = [
      { price: priceIds.base, quantity: 1 },
    ]

    if (extraSeats > 0) {
      lineItems.push({ price: priceIds.seat, quantity: extraSeats })
    }

    // Check founding member eligibility
    const foundingCouponId = getFoundingCouponId()
    let discounts: { coupon: string }[] = []

    if (foundingCouponId) {
      try {
        const coupon = await stripe.coupons.retrieve(foundingCouponId)
        const currentRedemptions = coupon.times_redeemed || 0
        const maxRedemptions = coupon.max_redemptions || 50

        if (currentRedemptions < maxRedemptions) {
          discounts = [{ coupon: foundingCouponId }]
        }
      } catch {
        // Coupon doesn't exist or error — continue without discount
      }
    }

    // Create Checkout Session
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: lineItems,
      ...(discounts.length > 0 ? { discounts } : {}),
      subscription_data: {
        metadata: {
          business_id: businessId,
          plan_tier: planTier,
          founding: discounts.length > 0 ? "true" : "false",
        },
      },
      metadata: {
        business_id: businessId,
        plan_tier: planTier,
        founding: discounts.length > 0 ? "true" : "false",
      },
      success_url: `${siteUrl}/settings/billing?success=true`,
      cancel_url: `${siteUrl}/settings/billing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("[checkout] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
