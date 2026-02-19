import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe/client"
import { PLAN_CONFIGS, type PlanTier } from "@/lib/stripe/config"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs"

async function logEvent(
  businessId: string,
  eventType: string,
  stripeEventId: string,
  metadata: Record<string, unknown> = {}
) {
  const admin = getSupabaseAdmin()
  await admin
    .from("subscription_events")
    .insert({
      business_id: businessId,
      event_type: eventType,
      stripe_event_id: stripeEventId,
      metadata,
    })
    .then(({ error }) => {
      if (error) console.error("[webhook] Failed to log event:", error)
    })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const admin = getSupabaseAdmin()

  // Read raw body for signature verification
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error("[webhook] Signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const businessId = session.metadata?.business_id
        if (!businessId) {
          console.error("[webhook] checkout.session.completed missing business_id metadata")
          break
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id

        const planTier = (session.metadata?.plan_tier || "pro") as PlanTier
        const config = PLAN_CONFIGS[planTier]

        await admin
          .from("businesses")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_tier: planTier,
            subscription_status: "active",
            included_seats: config.includedSeats,
            ai_credits_limit: config.aiCredits,
            ai_credits_used: 0,
            is_founding_member: session.metadata?.founding === "true",
          })
          .eq("id", businessId)

        await logEvent(businessId, "checkout.session.completed", event.id, {
          plan_tier: planTier,
          customer_id: customerId,
          subscription_id: subscriptionId,
        })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const businessId = subscription.metadata?.business_id

        if (!businessId) {
          // Try to find by subscription ID
          const { data: business } = await admin
            .from("businesses")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .single()
          if (!business) {
            console.error("[webhook] subscription.updated: cannot find business for", subscription.id)
            break
          }

          const status = mapSubscriptionStatus(subscription.status)
          await admin
            .from("businesses")
            .update({
              subscription_status: status,
              current_period_end: new Date(((subscription as any).current_period_end ?? 0) * 1000).toISOString(),
            })
            .eq("id", business.id)

          await logEvent(business.id, "customer.subscription.updated", event.id, {
            status,
          })
        } else {
          const status = mapSubscriptionStatus(subscription.status)
          await admin
            .from("businesses")
            .update({
              subscription_status: status,
              current_period_end: new Date(((subscription as any).current_period_end ?? 0) * 1000).toISOString(),
            })
            .eq("id", businessId)

          await logEvent(businessId, "customer.subscription.updated", event.id, {
            status,
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const { data: business } = await admin
          .from("businesses")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single()

        if (business) {
          await admin
            .from("businesses")
            .update({
              plan_tier: "free",
              subscription_status: "canceled",
              stripe_subscription_id: null,
              included_seats: 1,
              ai_credits_limit: 0,
              ai_credits_used: 0,
            })
            .eq("id", business.id)

          await logEvent(business.id, "customer.subscription.deleted", event.id)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id

        if (subscriptionId) {
          const { data: business } = await admin
            .from("businesses")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId)
            .single()

          if (business) {
            await admin
              .from("businesses")
              .update({ subscription_status: "past_due" })
              .eq("id", business.id)

            await logEvent(business.id, "invoice.payment_failed", event.id)
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id

        if (subscriptionId) {
          const { data: business } = await admin
            .from("businesses")
            .select("id, plan_tier")
            .eq("stripe_subscription_id", subscriptionId)
            .single()

          if (business) {
            const config = PLAN_CONFIGS[business.plan_tier as PlanTier] || PLAN_CONFIGS.free

            await admin
              .from("businesses")
              .update({
                subscription_status: "active",
                ai_credits_used: 0,
                ai_credits_limit: config.aiCredits,
              })
              .eq("id", business.id)

            await logEvent(business.id, "invoice.payment_succeeded", event.id)
          }
        }
        break
      }
    }
  } catch (err: any) {
    console.error("[webhook] Error processing event:", event.type, err)
    // Return 200 anyway to prevent Stripe from retrying — we've logged the error
  }

  return NextResponse.json({ received: true })
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): string {
  switch (status) {
    case "active":
      return "active"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "trialing":
      return "trialing"
    case "incomplete":
    case "incomplete_expired":
      return "incomplete"
    default:
      return "none"
  }
}
