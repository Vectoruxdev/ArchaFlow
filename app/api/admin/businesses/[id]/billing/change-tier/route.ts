import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import {
  PLAN_CONFIGS,
  getPriceIdsForTier,
  type PlanTier,
} from "@/lib/stripe/config"
import type Stripe from "stripe"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (isVerifyError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = getSupabaseAdmin()
  const businessId = params.id
  const { newTier, reason } = (await request.json()) as {
    newTier: PlanTier
    reason?: string
  }

  if (!newTier || !["free", "pro", "enterprise"].includes(newTier)) {
    return NextResponse.json(
      { error: "newTier must be free, pro, or enterprise" },
      { status: 400 }
    )
  }

  // Fetch business
  const { data: business, error } = await admin
    .from("businesses")
    .select("stripe_subscription_id, stripe_customer_id, subscription_status, plan_tier")
    .eq("id", businessId)
    .single()

  if (error || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (business.subscription_status === "comped") {
    return NextResponse.json(
      { error: "Cannot change tier for comped businesses. Remove comp first." },
      { status: 400 }
    )
  }

  const currentTier = business.plan_tier as PlanTier
  if (currentTier === newTier) {
    return NextResponse.json({ error: "Already on this tier" }, { status: 400 })
  }

  const stripe = getStripe()

  try {
    // Downgrade to free — cancel at period end
    if (newTier === "free") {
      if (!business.stripe_subscription_id) {
        // Already free-like, just update DB
        await admin
          .from("businesses")
          .update({
            plan_tier: "free",
            subscription_status: "none",
            included_seats: PLAN_CONFIGS.free.includedSeats,
            ai_credits_limit: PLAN_CONFIGS.free.aiCredits,
          })
          .eq("id", businessId)
      } else {
        await stripe.subscriptions.update(business.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
      }

      await admin.from("billing_overrides").insert({
        business_id: businessId,
        action_type: "tier_changed",
        details: { from: currentTier, to: newTier },
        reason: reason || null,
        performed_by: auth.userId,
        is_active: false,
      })

      return NextResponse.json({
        success: true,
        message: newTier === "free"
          ? "Subscription will be canceled at the end of the billing period"
          : `Tier changed to ${newTier}`,
      })
    }

    // Upgrade/change between paid tiers — requires active subscription
    if (!business.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription. Use Comp to grant a paid tier without a subscription." },
        { status: 400 }
      )
    }

    const subscription = await stripe.subscriptions.retrieve(
      business.stripe_subscription_id,
      { expand: ["items"] }
    )

    const oldPriceIds = getPriceIdsForTier(currentTier)
    const newPriceIds = getPriceIdsForTier(newTier)

    if (!newPriceIds) {
      return NextResponse.json({ error: "Invalid plan configuration" }, { status: 400 })
    }

    // Count current seats
    const { count: seatCount } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)

    const newConfig = PLAN_CONFIGS[newTier]
    const currentSeats = seatCount || 1
    const extraSeats = Math.max(0, currentSeats - newConfig.includedSeats)

    // Build update items
    const items: Stripe.SubscriptionUpdateParams.Item[] = []

    if (oldPriceIds) {
      const oldBaseItem = subscription.items.data.find(
        (item) => item.price.id === oldPriceIds.base
      )
      if (oldBaseItem) {
        items.push({ id: oldBaseItem.id, price: newPriceIds.base, quantity: 1 })
      } else {
        items.push({ price: newPriceIds.base, quantity: 1 })
      }

      const oldSeatItem = subscription.items.data.find(
        (item) => item.price.id === oldPriceIds.seat
      )
      if (oldSeatItem) {
        if (extraSeats > 0) {
          items.push({ id: oldSeatItem.id, price: newPriceIds.seat, quantity: extraSeats })
        } else {
          items.push({ id: oldSeatItem.id, deleted: true })
        }
      } else if (extraSeats > 0) {
        items.push({ price: newPriceIds.seat, quantity: extraSeats })
      }
    } else {
      // Upgrading from free (shouldn't normally happen here, but handle gracefully)
      items.push({ price: newPriceIds.base, quantity: 1 })
      if (extraSeats > 0) {
        items.push({ price: newPriceIds.seat, quantity: extraSeats })
      }
    }

    await stripe.subscriptions.update(business.stripe_subscription_id, {
      items,
      proration_behavior: "create_prorations",
      metadata: { business_id: businessId, plan_tier: newTier },
    })

    // Update local record
    await admin
      .from("businesses")
      .update({
        plan_tier: newTier,
        included_seats: newConfig.includedSeats,
        ai_credits_limit: newConfig.aiCredits,
      })
      .eq("id", businessId)

    // Log override
    await admin.from("billing_overrides").insert({
      business_id: businessId,
      action_type: "tier_changed",
      details: { from: currentTier, to: newTier },
      reason: reason || null,
      performed_by: auth.userId,
      is_active: false,
    })

    return NextResponse.json({
      success: true,
      message: `Tier changed from ${currentTier} to ${newTier} with proration`,
    })
  } catch (err: any) {
    console.error("[admin/billing/change-tier] Error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to change tier" },
      { status: 500 }
    )
  }
}
