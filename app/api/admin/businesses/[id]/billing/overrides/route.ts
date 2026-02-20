import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"
import { PLAN_CONFIGS, type PlanTier } from "@/lib/stripe/config"
import type { ActiveDiscount } from "@/lib/admin/types"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (isVerifyError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = getSupabaseAdmin()
  const businessId = params.id

  // Fetch business
  const { data: business, error } = await admin
    .from("businesses")
    .select("stripe_subscription_id, subscription_status, plan_tier")
    .eq("id", businessId)
    .single()

  if (error || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const isComped = business.subscription_status === "comped"
  const compedTier = isComped ? (business.plan_tier as PlanTier) : null

  // Get active discount from Stripe if subscription exists
  let activeDiscount: ActiveDiscount | null = null
  if (business.stripe_subscription_id && !isComped) {
    try {
      const stripe = getStripe()
      const subscription = await stripe.subscriptions.retrieve(
        business.stripe_subscription_id,
        { expand: ["discount.coupon"] }
      )

      const discount = (subscription as any).discount
      if (discount?.coupon) {
        const coupon = discount.coupon
        const planConfig = PLAN_CONFIGS[business.plan_tier as PlanTier]
        let effectivePrice = planConfig.basePrice

        if (coupon.percent_off) {
          effectivePrice = planConfig.basePrice * (1 - coupon.percent_off / 100)
          activeDiscount = {
            couponId: coupon.id,
            discountType: "percentage",
            discountValue: coupon.percent_off,
            duration: coupon.duration,
            durationInMonths: coupon.duration_in_months || undefined,
            effectivePrice: Math.round(effectivePrice * 100) / 100,
          }
        } else if (coupon.amount_off) {
          effectivePrice = planConfig.basePrice - coupon.amount_off / 100
          activeDiscount = {
            couponId: coupon.id,
            discountType: "fixed",
            discountValue: coupon.amount_off / 100,
            duration: coupon.duration,
            durationInMonths: coupon.duration_in_months || undefined,
            effectivePrice: Math.max(0, Math.round(effectivePrice * 100) / 100),
          }
        }
      }
    } catch (e: any) {
      console.warn("[admin/billing/overrides] Failed to fetch Stripe discount:", e.message)
    }
  }

  // Fetch override history
  const { data: overrides } = await admin
    .from("billing_overrides")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50)

  // Get performer emails
  const performerIds = [...new Set((overrides || []).map((o: any) => o.performed_by).filter(Boolean))]
  const performerEmails: Record<string, string> = {}
  for (const pid of performerIds) {
    try {
      const { data: { user } } = await admin.auth.admin.getUserById(pid)
      if (user?.email) performerEmails[pid] = user.email
    } catch { /* ignore */ }
  }

  const overrideHistory = (overrides || []).map((o: any) => ({
    id: o.id,
    businessId: o.business_id,
    actionType: o.action_type,
    details: o.details || {},
    reason: o.reason,
    performedBy: o.performed_by,
    performedByEmail: performerEmails[o.performed_by] || null,
    isActive: o.is_active,
    createdAt: o.created_at,
  }))

  return NextResponse.json({
    activeDiscount,
    isComped,
    compedTier,
    overrideHistory,
  })
}
