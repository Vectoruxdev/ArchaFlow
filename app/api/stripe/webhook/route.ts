import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe/client"
import { PLAN_CONFIGS, type PlanTier } from "@/lib/stripe/config"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendPaymentReceivedEmail } from "@/lib/email"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs"

async function isBusinessComped(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string
): Promise<boolean> {
  const { data } = await admin
    .from("businesses")
    .select("subscription_status")
    .eq("id", businessId)
    .single()
  return data?.subscription_status === "comped"
}

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

        // Skip if business is comped
        if (await isBusinessComped(admin, businessId)) {
          console.log("[webhook] Skipping checkout.session.completed for comped business", businessId)
          break
        }

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

          // Skip if business is comped
          if (await isBusinessComped(admin, business.id)) {
            console.log("[webhook] Skipping subscription.updated for comped business", business.id)
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
          // Skip if business is comped
          if (await isBusinessComped(admin, businessId)) {
            console.log("[webhook] Skipping subscription.updated for comped business", businessId)
            break
          }

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
          // Skip if business is comped
          if (await isBusinessComped(admin, business.id)) {
            console.log("[webhook] Skipping subscription.deleted for comped business", business.id)
            break
          }

          await admin
            .from("businesses")
            .update({
              plan_tier: "free",
              subscription_status: "canceled",
              stripe_subscription_id: null,
              included_seats: 1,
              ai_credits_limit: PLAN_CONFIGS.free.aiCredits,
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
            // Skip if business is comped
            if (await isBusinessComped(admin, business.id)) {
              console.log("[webhook] Skipping invoice.payment_failed for comped business", business.id)
              break
            }

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
            // Skip if business is comped
            if (await isBusinessComped(admin, business.id)) {
              console.log("[webhook] Skipping invoice.payment_succeeded for comped business", business.id)
              break
            }

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

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const invoiceId = paymentIntent.metadata?.invoice_id

        // Only handle invoice payments (skip subscription payments etc.)
        if (!invoiceId) break

        // Idempotency: check if payment already recorded
        const { data: existingPayment } = await admin
          .from("invoice_payments")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle()

        if (existingPayment) {
          console.log("[webhook] payment_intent.succeeded: already recorded, skipping", paymentIntent.id)
          break
        }

        // Load invoice
        const { data: inv } = await admin
          .from("invoices")
          .select("id, invoice_number, business_id, amount_paid, amount_due, client_id")
          .eq("id", invoiceId)
          .single()

        if (!inv) {
          console.error("[webhook] payment_intent.succeeded: invoice not found", invoiceId)
          break
        }

        const paymentAmount = paymentIntent.amount / 100 // Convert cents to dollars
        const chargeId = typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id || null

        // Insert payment record
        await admin.from("invoice_payments").insert({
          invoice_id: inv.id,
          amount: paymentAmount,
          payment_method: "credit_card",
          payment_date: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: chargeId,
        })

        // Update invoice totals
        const newAmountPaid = parseFloat(inv.amount_paid) + paymentAmount
        const newAmountDue = parseFloat(inv.amount_due) - paymentAmount
        const newStatus = newAmountDue <= 0.005 ? "paid" : "partially_paid"

        await admin
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            amount_due: Math.max(0, newAmountDue),
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", inv.id)

        // Send payment received email to client
        if (inv.client_id) {
          const { data: client } = await admin
            .from("clients")
            .select("first_name, last_name, email")
            .eq("id", inv.client_id)
            .single()

          const { data: biz } = await admin
            .from("businesses")
            .select("name")
            .eq("id", inv.business_id)
            .single()

          if (client?.email) {
            sendPaymentReceivedEmail({
              to: client.email,
              recipientName: `${client.first_name || ""} ${client.last_name || ""}`.trim() || "Client",
              businessName: biz?.name || "Your service provider",
              invoiceNumber: inv.invoice_number,
              paymentAmount: `$${paymentAmount.toFixed(2)}`,
              remainingBalance: `$${Math.max(0, newAmountDue).toFixed(2)}`,
            }).catch((err) => console.error("[webhook] Failed to send payment email:", err))
          }
        }

        // Log activity
        admin
          .from("workspace_activities")
          .insert({
            business_id: inv.business_id,
            activity_type: "payment_received",
            entity_type: "invoice",
            entity_id: inv.id,
            message: `Payment of $${paymentAmount.toFixed(2)} received on invoice ${inv.invoice_number}`,
            metadata: { stripe_payment_intent_id: paymentIntent.id },
          })
          .then(({ error: actErr }) => {
            if (actErr) console.error("[webhook] Failed to log activity:", actErr)
          })

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const invoiceId = paymentIntent.metadata?.invoice_id
        if (invoiceId) {
          console.log("[webhook] payment_intent.payment_failed for invoice:", invoiceId, paymentIntent.last_payment_error?.message)
        }
        break
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account

        const { data: biz } = await admin
          .from("businesses")
          .select("id")
          .eq("stripe_connect_account_id", account.id)
          .single()

        if (biz) {
          await admin
            .from("businesses")
            .update({
              stripe_connect_onboarding_complete: account.charges_enabled,
            })
            .eq("id", biz.id)
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
