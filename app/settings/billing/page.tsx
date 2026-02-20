"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlanBadge } from "@/components/billing/plan-badge"
import { useAuth } from "@/lib/auth/auth-context"
import { PLAN_CONFIGS, type PlanTier } from "@/lib/stripe/config"
import { supabase } from "@/lib/supabase/client"
import {
  CreditCard,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Crown,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Download,
  Calendar,
  Receipt,
  Gift,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface SubscriptionEvent {
  id: string
  event_type: string
  created_at: string
  metadata: Record<string, unknown>
}

interface PaymentMethod {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

interface Invoice {
  id: string
  date: string | null
  amountDue: number
  amountPaid: number
  currency: string
  status: string | null
  invoicePdf: string | null
}

interface SubscriptionInfo {
  currentPeriodEnd: string | null
  status: string
}

export default function BillingPage() {
  const { currentWorkspace, user, refreshWorkspaces } = useAuth()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [events, setEvents] = useState<SubscriptionEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [pmLoading, setPmLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)

  const workspace = currentWorkspace
  const isOwner = workspace?.role === "owner"
  const tier = (workspace?.planTier || "free") as PlanTier
  const config = PLAN_CONFIGS[tier]

  // Show success/cancel toast from Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome to your new plan.")
      refreshWorkspaces()
    } else if (searchParams.get("canceled") === "true") {
      toast("Checkout canceled. No changes were made.")
    }
  }, [searchParams])

  // Load recent subscription events
  useEffect(() => {
    if (!workspace?.id) return
    setEventsLoading(true)

    supabase
      .from("subscription_events")
      .select("id, event_type, created_at, metadata")
      .eq("business_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setEvents(data || [])
        setEventsLoading(false)
      })
  }, [workspace?.id])

  // Load payment method
  useEffect(() => {
    if (!workspace?.id || tier === "free") {
      setPmLoading(false)
      return
    }
    setPmLoading(true)
    fetch(`/api/stripe/payment-method?businessId=${workspace.id}`)
      .then((res) => res.json())
      .then((data) => setPaymentMethod(data.paymentMethod || null))
      .catch(() => setPaymentMethod(null))
      .finally(() => setPmLoading(false))
  }, [workspace?.id, tier])

  // Load invoices and subscription info
  useEffect(() => {
    if (!workspace?.id || tier === "free") {
      setInvoicesLoading(false)
      return
    }
    setInvoicesLoading(true)
    fetch(`/api/stripe/invoices?businessId=${workspace.id}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data.invoices || [])
        setSubscriptionInfo(data.subscription || null)
      })
      .catch(() => {
        setInvoices([])
        setSubscriptionInfo(null)
      })
      .finally(() => setInvoicesLoading(false))
  }, [workspace?.id, tier])

  async function handleCheckout(planTier: PlanTier) {
    if (!workspace?.id) return
    setLoading("checkout")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: workspace.id, planTier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout")
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    if (!workspace?.id) return
    setLoading("portal")
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: workspace.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal")
    } finally {
      setLoading(null)
    }
  }

  async function handleChangePlan(newTier: PlanTier) {
    if (!workspace?.id) return
    setLoading("change")
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: workspace.id, newTier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || "Plan updated successfully")
      refreshWorkspaces()
    } catch (err: any) {
      toast.error(err.message || "Failed to change plan")
    } finally {
      setLoading(null)
    }
  }

  // Compute seat breakdown and estimated charge
  const seatCount = workspace?.seatCount || 1
  const includedSeats = workspace?.includedSeats || 1
  const extraSeats = Math.max(0, seatCount - includedSeats)
  const extraSeatCost = extraSeats * config.seatPrice
  const estimatedCharge = config.basePrice + extraSeatCost

  function formatCurrency(cents: number, currency: string = "usd") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  }

  function formatCardBrand(brand: string) {
    const brands: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "Amex",
      discover: "Discover",
      diners: "Diners Club",
      jcb: "JCB",
      unionpay: "UnionPay",
    }
    return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  function formatEventType(type: string) {
    return type
      .replace("customer.subscription.", "")
      .replace("checkout.session.", "")
      .replace("invoice.", "")
      .replace(/[._]/g, " ")
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Header */}
          <div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Settings
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Billing & Plan</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage your subscription, seats, and billing details.
                </p>
              </div>
              {workspace && <PlanBadge tier={tier} />}
            </div>
          </div>

          {/* Comped banner */}
          {workspace?.subscriptionStatus === "comped" && (
            <div className="flex items-center gap-3 rounded-lg border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/10 p-4">
              <Gift className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-purple-700 dark:text-purple-400">
                  Complimentary Plan
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Your {config.name} plan has been comped by an administrator. You have full access to all {config.name} features at no cost.
                </p>
              </div>
            </div>
          )}

          {/* Past due warning */}
          {workspace?.subscriptionStatus === "past_due" && (
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 p-4">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-orange-700 dark:text-orange-400">
                  Payment past due
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Your last payment failed. Please update your payment method to avoid service interruption.
                </p>
              </div>
              {isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto flex-shrink-0"
                  onClick={handlePortal}
                  disabled={!!loading}
                >
                  Update Payment
                </Button>
              )}
            </div>
          )}

          {/* Current Plan Card */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Current Plan</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.name} — ${config.basePrice}/mo
                    {config.basePrice > 0 && ` + $${config.seatPrice}/extra seat`}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Founding member badge */}
              {workspace?.isFoundingMember && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Founding Member — 60% discount active
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <Badge
                  className={
                    workspace?.subscriptionStatus === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : workspace?.subscriptionStatus === "comped"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : workspace?.subscriptionStatus === "past_due"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }
                >
                  {workspace?.subscriptionStatus === "none"
                    ? "Free Tier"
                    : workspace?.subscriptionStatus === "comped"
                      ? "Complimentary"
                      : workspace?.subscriptionStatus}
                </Badge>
              </div>

              {/* Actions */}
              {isOwner && workspace?.subscriptionStatus !== "comped" && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tier === "free" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleCheckout("pro")}
                        disabled={!!loading}
                      >
                        Upgrade to Pro
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckout("enterprise")}
                        disabled={!!loading}
                      >
                        Upgrade to Enterprise
                      </Button>
                    </>
                  )}
                  {tier === "pro" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleChangePlan("enterprise")}
                        disabled={!!loading}
                      >
                        Upgrade to Enterprise
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePortal}
                        disabled={!!loading}
                      >
                        Manage Billing
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleChangePlan("free")}
                        disabled={!!loading}
                      >
                        Cancel Plan
                      </Button>
                    </>
                  )}
                  {tier === "enterprise" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangePlan("pro")}
                        disabled={!!loading}
                      >
                        Downgrade to Pro
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePortal}
                        disabled={!!loading}
                      >
                        Manage Billing
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleChangePlan("free")}
                        disabled={!!loading}
                      >
                        Cancel Plan
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Usage Section with Seat Breakdown */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold">Usage</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Seats */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Seats</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {seatCount} / {includedSeats} included
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (seatCount / Math.max(includedSeats, 1)) * 100)}%`,
                    }}
                  />
                </div>
                {/* Seat breakdown detail */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {includedSeats} included
                  {extraSeats > 0 && (
                    <> + {extraSeats} extra (${extraSeatCost}/mo)</>
                  )}
                  {" "}= {seatCount} total
                </p>
              </div>

              {/* AI Credits */}
              {config.hasAI && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">AI Credits</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {workspace?.aiCreditsUsed || 0} / {workspace?.aiCreditsLimit || 0} used
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (workspace?.aiCreditsUsed || 0) > (workspace?.aiCreditsLimit || 0) * 0.9
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(100, ((workspace?.aiCreditsUsed || 0) / Math.max(workspace?.aiCreditsLimit || 1, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Billing Date + Estimated Charge (paid plans only) */}
          {tier !== "free" && subscriptionInfo?.currentPeriodEnd && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h2 className="font-semibold">Next Billing</h2>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Next billing date</span>
                  <span className="font-medium">
                    {new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Estimated charge</span>
                  <span className="font-medium">
                    ${estimatedCharge}/mo
                    {extraSeats > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        (${config.basePrice} base + ${extraSeatCost} seats)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method (paid plans only) */}
          {tier !== "free" && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h2 className="font-semibold">Payment Method</h2>
                </div>
              </div>
              <div className="p-6">
                {pmLoading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : paymentMethod ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-7 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                        {formatCardBrand(paymentMethod.brand).slice(0, 4)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {formatCardBrand(paymentMethod.brand)} ending in {paymentMethod.last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires {String(paymentMethod.expMonth).padStart(2, "0")}/{paymentMethod.expYear}
                        </p>
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePortal}
                        disabled={!!loading}
                      >
                        Update
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">No payment method on file.</p>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePortal}
                        disabled={!!loading}
                      >
                        Add Payment Method
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice History (paid plans only) */}
          {tier !== "free" && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h2 className="font-semibold">Invoice History</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {invoicesLoading ? (
                  <div className="p-6 text-sm text-gray-500">Loading...</div>
                ) : invoices.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">No invoices yet.</div>
                ) : (
                  invoices.map((inv) => (
                    <div key={inv.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {inv.date
                              ? new Date(inv.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(inv.amountPaid || inv.amountDue, inv.currency)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            inv.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : inv.status === "open"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }
                        >
                          {inv.status || "unknown"}
                        </Badge>
                        {inv.invoicePdf && (
                          <a
                            href={inv.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent Billing Events */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold">Recent Billing Events</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {eventsLoading ? (
                <div className="p-6 text-sm text-gray-500">Loading...</div>
              ) : events.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No billing events yet.</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm capitalize">
                        {formatEventType(event.event_type)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
