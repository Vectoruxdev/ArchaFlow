import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import { PLAN_CONFIGS, type PlanTier } from "@/lib/stripe/config"

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
    .select("stripe_subscription_id, stripe_customer_id, subscription_status, plan_tier")
    .eq("id", businessId)
    .single()

  if (error || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  try {
    if (action === "apply") {
      const { tier, reason } = body as {
        tier: "pro" | "enterprise"
        reason?: string
      }

      if (!tier || !["pro", "enterprise"].includes(tier)) {
        return NextResponse.json(
          { error: "Tier must be 'pro' or 'enterprise'" },
          { status: 400 }
        )
      }

      const config = PLAN_CONFIGS[tier]

      // If business has an active Stripe subscription, cancel it
      if (
        business.stripe_subscription_id &&
        business.subscription_status &&
        !["canceled", "none"].includes(business.subscription_status)
      ) {
        const stripe = getStripe()
        try {
          await stripe.subscriptions.cancel(business.stripe_subscription_id)
        } catch (e: any) {
          console.warn("[admin/billing/comp] Failed to cancel subscription:", e.message)
        }
      }

      // Deactivate previous comp overrides
      await admin
        .from("billing_overrides")
        .update({ is_active: false })
        .eq("business_id", businessId)
        .eq("action_type", "comp_applied")
        .eq("is_active", true)

      // Update business with comped status and tier features
      const { error: updateError } = await admin
        .from("businesses")
        .update({
          plan_tier: tier,
          subscription_status: "comped",
          stripe_subscription_id: null,
          included_seats: config.includedSeats,
          ai_credits_limit: config.aiCredits,
          ai_credits_used: 0,
        })
        .eq("id", businessId)

      if (updateError) {
        console.error("[admin/billing/comp] DB update failed:", updateError)
        return NextResponse.json(
          { error: `Failed to update business: ${updateError.message}` },
          { status: 500 }
        )
      }

      // Log override
      await admin.from("billing_overrides").insert({
        business_id: businessId,
        action_type: "comp_applied",
        details: { tier },
        reason: reason || null,
        performed_by: auth.userId,
        is_active: true,
      })

      return NextResponse.json({
        success: true,
        message: `Business comped with ${config.name} tier`,
      })
    } else if (action === "remove") {
      const { reason } = body as { reason?: string }

      if (business.subscription_status !== "comped") {
        return NextResponse.json(
          { error: "Business is not currently comped" },
          { status: 400 }
        )
      }

      const freeConfig = PLAN_CONFIGS.free

      // Downgrade to free
      const { error: removeError } = await admin
        .from("businesses")
        .update({
          plan_tier: "free",
          subscription_status: "none",
          included_seats: freeConfig.includedSeats,
          ai_credits_limit: freeConfig.aiCredits,
          ai_credits_used: 0,
        })
        .eq("id", businessId)

      if (removeError) {
        console.error("[admin/billing/comp] DB remove failed:", removeError)
        return NextResponse.json(
          { error: `Failed to update business: ${removeError.message}` },
          { status: 500 }
        )
      }

      // Deactivate comp overrides
      await admin
        .from("billing_overrides")
        .update({ is_active: false })
        .eq("business_id", businessId)
        .eq("action_type", "comp_applied")
        .eq("is_active", true)

      // Log removal
      await admin.from("billing_overrides").insert({
        business_id: businessId,
        action_type: "comp_removed",
        details: { previousTier: business.plan_tier },
        reason: reason || null,
        performed_by: auth.userId,
        is_active: false,
      })

      return NextResponse.json({
        success: true,
        message: "Comp removed. Business downgraded to Free.",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("[admin/billing/comp] Error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to manage comp" },
      { status: 500 }
    )
  }
}
