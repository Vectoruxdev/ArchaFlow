import { getStripe } from "./client"
import { PLAN_CONFIGS, getPriceIdsForTier, type PlanTier } from "./config"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/**
 * Count current seats (user_roles) for a business and sync to Stripe.
 * Updates the "extra seat" subscription item quantity.
 */
export async function syncSeatsToStripe(businessId: string) {
  const admin = getSupabaseAdmin()

  // Get business billing info
  const { data: business, error } = await admin
    .from("businesses")
    .select("stripe_subscription_id, plan_tier, included_seats")
    .eq("id", businessId)
    .single()

  if (error || !business) {
    console.error("[syncSeats] Business not found:", businessId, error)
    return
  }

  if (business.plan_tier === "free" || !business.stripe_subscription_id) {
    // Free tier or no subscription — just update local seat count
    const { count } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)

    await admin
      .from("businesses")
      .update({ seat_count: count || 1 })
      .eq("id", businessId)
    return
  }

  // Count current members
  const { count: seatCount } = await admin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)

  const currentSeats = seatCount || 1
  const tier = business.plan_tier as PlanTier
  const included = business.included_seats || PLAN_CONFIGS[tier].includedSeats
  const extraSeats = Math.max(0, currentSeats - included)

  // Update local seat count
  await admin
    .from("businesses")
    .update({ seat_count: currentSeats })
    .eq("id", businessId)

  // Find the seat line item in the Stripe subscription
  const stripe = getStripe()
  const priceIds = getPriceIdsForTier(tier)
  if (!priceIds) return

  const subscription = await stripe.subscriptions.retrieve(
    business.stripe_subscription_id,
    { expand: ["items"] }
  )

  const seatItem = subscription.items.data.find(
    (item) => item.price.id === priceIds.seat
  )

  if (seatItem) {
    // Update quantity (Stripe allows 0 for per-unit items)
    await stripe.subscriptionItems.update(seatItem.id, {
      quantity: extraSeats,
    })
  } else if (extraSeats > 0) {
    // Add seat line item if it doesn't exist yet
    await stripe.subscriptionItems.create({
      subscription: business.stripe_subscription_id,
      price: priceIds.seat,
      quantity: extraSeats,
    })
  }
}
