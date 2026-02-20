import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"

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
  const body = await request.json()
  const { action } = body as { action: "apply" | "remove" }

  // Fetch business
  const { data: business, error } = await admin
    .from("businesses")
    .select("stripe_subscription_id, stripe_customer_id, subscription_status, plan_tier, is_founding_member")
    .eq("id", businessId)
    .single()

  if (error || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (business.subscription_status === "comped") {
    return NextResponse.json(
      { error: "Cannot apply discounts to comped businesses. Remove comp first." },
      { status: 400 }
    )
  }

  if (!business.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription. Cannot apply discount without a Stripe subscription." },
      { status: 400 }
    )
  }

  const stripe = getStripe()

  try {
    if (action === "apply") {
      const { discountType, discountValue, duration, durationInMonths, reason } = body as {
        discountType: "percentage" | "fixed"
        discountValue: number
        duration: "forever" | "once" | "repeating"
        durationInMonths?: number
        reason?: string
      }

      // Validate
      if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
        return NextResponse.json({ error: "Percentage must be between 1 and 100" }, { status: 400 })
      }
      if (discountType === "fixed" && discountValue <= 0) {
        return NextResponse.json({ error: "Fixed amount must be greater than 0" }, { status: 400 })
      }
      if (duration === "repeating" && (!durationInMonths || durationInMonths < 1)) {
        return NextResponse.json({ error: "Duration in months required for repeating discounts" }, { status: 400 })
      }

      // Create coupon
      const couponParams: Record<string, unknown> = {
        duration,
        name: `Admin discount for ${businessId}`,
        metadata: { admin_applied: "true", business_id: businessId },
      }

      if (discountType === "percentage") {
        couponParams.percent_off = discountValue
      } else {
        couponParams.amount_off = Math.round(discountValue * 100) // convert dollars to cents
        couponParams.currency = "usd"
      }

      if (duration === "repeating" && durationInMonths) {
        couponParams.duration_in_months = durationInMonths
      }

      const coupon = await stripe.coupons.create(couponParams as any)

      // Apply coupon to subscription (replaces any existing discount)
      // Stripe v20 types removed `coupon` from SubscriptionUpdateParams
      await stripe.subscriptions.update(business.stripe_subscription_id, {
        coupon: coupon.id,
      } as any)

      // Deactivate previous discount overrides
      await admin
        .from("billing_overrides")
        .update({ is_active: false })
        .eq("business_id", businessId)
        .eq("action_type", "discount_applied")
        .eq("is_active", true)

      // Log override
      await admin.from("billing_overrides").insert({
        business_id: businessId,
        action_type: "discount_applied",
        details: { discountType, discountValue, duration, durationInMonths, couponId: coupon.id },
        reason: reason || null,
        performed_by: auth.userId,
        is_active: true,
      })

      return NextResponse.json({
        success: true,
        couponId: coupon.id,
        message: `Discount applied: ${discountType === "percentage" ? `${discountValue}%` : `$${discountValue}`} off (${duration})`,
      })
    } else if (action === "remove") {
      const { reason } = body as { reason?: string }

      // Remove discount from subscription
      // Stripe v20 types removed `coupon` from SubscriptionUpdateParams
      await stripe.subscriptions.update(business.stripe_subscription_id, {
        coupon: "",
      } as any)

      // Deactivate discount overrides
      await admin
        .from("billing_overrides")
        .update({ is_active: false })
        .eq("business_id", businessId)
        .eq("action_type", "discount_applied")
        .eq("is_active", true)

      // Log removal
      await admin.from("billing_overrides").insert({
        business_id: businessId,
        action_type: "discount_removed",
        details: {},
        reason: reason || null,
        performed_by: auth.userId,
        is_active: false,
      })

      return NextResponse.json({ success: true, message: "Discount removed" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("[admin/billing/discount] Error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to manage discount" },
      { status: 500 }
    )
  }
}
