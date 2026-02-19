import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import {
  PLAN_CONFIGS,
  getPriceIdsForTier,
  type PlanTier,
} from "@/lib/stripe/config"
import type Stripe from "stripe"

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

    const { businessId, newTier } = (await request.json()) as {
      businessId: string
      newTier: PlanTier
    }

    if (!businessId || !newTier || !["free", "pro", "enterprise"].includes(newTier)) {
      return NextResponse.json(
        { error: "businessId and newTier (free, pro, or enterprise) are required" },
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

    const { data: business } = await admin
      .from("businesses")
      .select("stripe_subscription_id, plan_tier, stripe_customer_id")
      .eq("id", businessId)
      .single()

    if (!business?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Downgrade to free — cancel at period end
    if (newTier === "free") {
      await stripe.subscriptions.update(business.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      return NextResponse.json({
        success: true,
        message: "Subscription will be canceled at the end of the current billing period",
      })
    }

    // Swap between Pro <-> Enterprise
    const currentTier = business.plan_tier as PlanTier
    if (currentTier === newTier) {
      return NextResponse.json(
        { error: "Already on this plan" },
        { status: 400 }
      )
    }

    const subscription = await stripe.subscriptions.retrieve(
      business.stripe_subscription_id,
      { expand: ["items"] }
    )

    const oldPriceIds = getPriceIdsForTier(currentTier)
    const newPriceIds = getPriceIdsForTier(newTier)

    if (!oldPriceIds || !newPriceIds) {
      return NextResponse.json(
        { error: "Invalid plan configuration" },
        { status: 400 }
      )
    }

    // Count current seats for the new seat line item
    const { count: seatCount } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)

    const newConfig = PLAN_CONFIGS[newTier]
    const currentSeats = seatCount || 1
    const extraSeats = Math.max(0, currentSeats - newConfig.includedSeats)

    // Build update items: replace old prices with new prices
    const items: Stripe.SubscriptionUpdateParams.Item[] = []

    // Find and replace the base price item
    const oldBaseItem = subscription.items.data.find(
      (item) => item.price.id === oldPriceIds.base
    )
    if (oldBaseItem) {
      items.push({ id: oldBaseItem.id, price: newPriceIds.base, quantity: 1 })
    } else {
      items.push({ price: newPriceIds.base, quantity: 1 })
    }

    // Find and replace or add the seat price item
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

    await stripe.subscriptions.update(business.stripe_subscription_id, {
      items,
      proration_behavior: "create_prorations",
      metadata: {
        business_id: businessId,
        plan_tier: newTier,
      },
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

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[change-plan] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
