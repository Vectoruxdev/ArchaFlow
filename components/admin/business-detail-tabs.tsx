"use client"

import { useCallback, useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PlanBadge } from "@/components/billing/plan-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ExternalLink, Star, Percent, Gift, ArrowUpDown, X } from "lucide-react"
import type { AdminMember, AdminActivityEntry, BillingOverride, ActiveDiscount } from "@/lib/admin/types"
import type { PlanTier } from "@/lib/stripe/config"
import { PLAN_CONFIGS } from "@/lib/stripe/config"
import { DiscountModal } from "@/components/admin/billing/discount-modal"
import { CompPlanModal } from "@/components/admin/billing/comp-plan-modal"
import { ChangeTierModal } from "@/components/admin/billing/change-tier-modal"
import { toast } from "sonner"

interface BusinessDetailData {
  id: string
  name: string
  planTier: "free" | "pro" | "enterprise"
  subscriptionStatus: string | null
  memberCount: number
  ownerEmail: string | null
  seatCount: number
  aiCreditsUsed: number
  isFoundingMember: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId?: string | null
  currentPeriodEnd?: string | null
  createdAt: string
  recentActivity: AdminActivityEntry[]
}

interface BusinessDetailTabsProps {
  business: BusinessDetailData
  onRefresh?: () => void
}

export function BusinessDetailTabs({ business, onRefresh }: BusinessDetailTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab business={business} />
      </TabsContent>
      <TabsContent value="members">
        <MembersTab businessId={business.id} />
      </TabsContent>
      <TabsContent value="billing">
        <BillingTab business={business} onRefresh={onRefresh || (() => {})} />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityTab businessId={business.id} initialActivity={business.recentActivity} />
      </TabsContent>
    </Tabs>
  )
}

function OverviewTab({ business }: { business: BusinessDetailData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Business Info
        </h3>
        <InfoRow label="Name" value={business.name} />
        <InfoRow
          label="Plan"
          value={<PlanBadge tier={business.planTier} />}
        />
        <InfoRow
          label="Status"
          value={business.subscriptionStatus || "No subscription"}
        />
        <InfoRow label="Owner" value={business.ownerEmail || "—"} />
        <InfoRow
          label="Created"
          value={new Date(business.createdAt).toLocaleDateString()}
        />
        {business.isFoundingMember && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Founding Member</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Usage
        </h3>
        <InfoRow label="Members" value={business.memberCount} />
        <InfoRow label="Seat Count" value={business.seatCount} />
        <InfoRow label="AI Credits Used" value={business.aiCreditsUsed} />
      </div>
    </div>
  )
}

function MembersTab({ businessId }: { businessId: string }) {
  const [members, setMembers] = useState<AdminMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/admin/businesses/${businessId}/members`)
        if (res.ok) {
          const data = await res.json()
          setMembers(data.members)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [businessId])

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading members...</div>
  }

  return (
    <div className="mt-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
              Email
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
              Name
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
              Role
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
              Position
            </th>
            <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
              Joined
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr
              key={m.userId}
              className="border-b border-gray-100 dark:border-gray-800/50 last:border-0"
            >
              <td className="px-6 py-3 text-sm">{m.email}</td>
              <td className="px-6 py-3 text-sm">{m.fullName || "—"}</td>
              <td className="px-6 py-3">
                <Badge variant="secondary">{m.roleName}</Badge>
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                {m.position || "—"}
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                {new Date(m.assignedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                No members found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function BillingTab({ business, onRefresh }: { business: BusinessDetailData; onRefresh: () => void }) {
  const stripeBaseUrl = "https://dashboard.stripe.com"

  const [overridesLoading, setOverridesLoading] = useState(true)
  const [activeDiscount, setActiveDiscount] = useState<ActiveDiscount | null>(null)
  const [isComped, setIsComped] = useState(false)
  const [compedTier, setCompedTier] = useState<PlanTier | null>(null)
  const [overrideHistory, setOverrideHistory] = useState<BillingOverride[]>([])
  const [removingDiscount, setRemovingDiscount] = useState(false)
  const [removingComp, setRemovingComp] = useState(false)

  // Modals
  const [discountOpen, setDiscountOpen] = useState(false)
  const [compOpen, setCompOpen] = useState(false)
  const [changeTierOpen, setChangeTierOpen] = useState(false)

  const fetchOverrides = useCallback(async () => {
    setOverridesLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/billing/overrides`)
      if (res.ok) {
        const data = await res.json()
        setActiveDiscount(data.activeDiscount)
        setIsComped(data.isComped)
        setCompedTier(data.compedTier)
        setOverrideHistory(data.overrideHistory)
      }
    } finally {
      setOverridesLoading(false)
    }
  }, [business.id])

  useEffect(() => {
    fetchOverrides()
  }, [fetchOverrides])

  function handleActionSuccess() {
    fetchOverrides()
    onRefresh()
  }

  async function handleRemoveDiscount() {
    setRemovingDiscount(true)
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/billing/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Discount removed")
      handleActionSuccess()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove discount")
    } finally {
      setRemovingDiscount(false)
    }
  }

  async function handleRemoveComp() {
    setRemovingComp(true)
    try {
      const res = await fetch(`/api/admin/businesses/${business.id}/billing/comp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Comp removed")
      handleActionSuccess()
    } catch (err: any) {
      toast.error(err.message || "Failed to remove comp")
    } finally {
      setRemovingComp(false)
    }
  }

  const hasSubscription = !!business.stripeSubscriptionId &&
    !!business.subscriptionStatus &&
    !["canceled", "none"].includes(business.subscriptionStatus)

  return (
    <div className="mt-4 space-y-4">
      {/* Billing Details Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Billing Details
        </h3>
        <InfoRow
          label="Plan"
          value={
            <div className="flex items-center gap-2">
              <PlanBadge tier={business.planTier} />
              {isComped && (
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Comped
                </Badge>
              )}
            </div>
          }
        />
        <InfoRow
          label="Subscription Status"
          value={business.subscriptionStatus || "None"}
        />
        <InfoRow label="Seat Count" value={business.seatCount} />
        {business.currentPeriodEnd && (
          <InfoRow
            label="Current Period End"
            value={new Date(business.currentPeriodEnd).toLocaleDateString()}
          />
        )}
        {business.isFoundingMember && (
          <InfoRow
            label="Founding Member"
            value={
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Yes
              </Badge>
            }
          />
        )}

        {/* Active Discount Display */}
        {activeDiscount && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Active Discount:{" "}
                {activeDiscount.discountType === "percentage"
                  ? `${activeDiscount.discountValue}% off`
                  : `$${activeDiscount.discountValue} off`}
                {" "}({activeDiscount.duration}
                {activeDiscount.duration === "repeating" && activeDiscount.durationInMonths
                  ? ` - ${activeDiscount.durationInMonths} months`
                  : ""}
                )
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                Effective price: ${activeDiscount.effectivePrice}/mo
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveDiscount}
              disabled={removingDiscount}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              {removingDiscount ? "Removing..." : "Remove"}
            </Button>
          </div>
        )}

        {/* Comped Status Display */}
        {isComped && compedTier && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Comped: {PLAN_CONFIGS[compedTier].name}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-500">
                Free access to {PLAN_CONFIGS[compedTier].name} features
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveComp}
              disabled={removingComp}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              {removingComp ? "Removing..." : "Remove Comp"}
            </Button>
          </div>
        )}

        {/* Stripe Links */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Stripe Links
          </h4>
          {business.stripeCustomerId ? (
            <a
              href={`${stripeBaseUrl}/customers/${business.stripeCustomerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View Customer in Stripe
            </a>
          ) : (
            <p className="text-sm text-gray-500">No Stripe customer ID</p>
          )}
          {business.stripeSubscriptionId && (
            <div>
              <a
                href={`${stripeBaseUrl}/subscriptions/${business.stripeSubscriptionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View Subscription in Stripe
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Admin Actions Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Admin Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDiscountOpen(true)}
            disabled={isComped || !hasSubscription}
          >
            <Percent className="h-4 w-4 mr-1.5" />
            Apply Discount
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompOpen(true)}
            disabled={isComped}
          >
            <Gift className="h-4 w-4 mr-1.5" />
            Comp Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChangeTierOpen(true)}
            disabled={isComped}
          >
            <ArrowUpDown className="h-4 w-4 mr-1.5" />
            Change Tier
          </Button>
        </div>
        {isComped && (
          <p className="text-xs text-gray-500">
            Some actions are disabled while the business is comped. Remove the comp first.
          </p>
        )}
        {!hasSubscription && !isComped && (
          <p className="text-xs text-gray-500">
            Discount requires an active subscription. Use Comp Plan to grant features without payment.
          </p>
        )}
      </div>

      {/* Override History Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Override History
          </h3>
        </div>
        {overridesLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        ) : overrideHistory.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No billing overrides recorded</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {overrideHistory.map((o) => (
              <div key={o.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatOverrideType(o.actionType)}
                      </span>
                      {o.isActive && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                    {o.reason && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {o.reason}
                      </p>
                    )}
                    {o.details && Object.keys(o.details).length > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatOverrideDetails(o.actionType, o.details)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                    {o.performedByEmail && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {o.performedByEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <DiscountModal
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        businessId={business.id}
        planTier={business.planTier}
        isFoundingMember={business.isFoundingMember}
        onSuccess={handleActionSuccess}
      />
      <CompPlanModal
        open={compOpen}
        onOpenChange={setCompOpen}
        businessId={business.id}
        hasActiveSubscription={hasSubscription}
        onSuccess={handleActionSuccess}
      />
      <ChangeTierModal
        open={changeTierOpen}
        onOpenChange={setChangeTierOpen}
        businessId={business.id}
        currentTier={business.planTier}
        isComped={isComped}
        hasSubscription={hasSubscription}
        onSuccess={handleActionSuccess}
      />
    </div>
  )
}

function formatOverrideType(type: string): string {
  const labels: Record<string, string> = {
    discount_applied: "Discount Applied",
    discount_removed: "Discount Removed",
    comp_applied: "Plan Comped",
    comp_removed: "Comp Removed",
    tier_changed: "Tier Changed",
  }
  return labels[type] || type.replace(/_/g, " ")
}

function formatOverrideDetails(type: string, details: Record<string, unknown>): string {
  if (type === "discount_applied") {
    const dt = details.discountType === "percentage" ? `${details.discountValue}%` : `$${details.discountValue}`
    return `${dt} off (${details.duration}${details.durationInMonths ? ` - ${details.durationInMonths}mo` : ""})`
  }
  if (type === "comp_applied") {
    return `Tier: ${(details.tier as string)?.charAt(0).toUpperCase()}${(details.tier as string)?.slice(1)}`
  }
  if (type === "tier_changed") {
    return `${details.from} → ${details.to}`
  }
  return ""
}

function ActivityTab({
  businessId,
  initialActivity,
}: {
  businessId: string
  initialActivity: AdminActivityEntry[]
}) {
  const [activities, setActivities] = useState(initialActivity)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 25

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/admin/businesses/${businessId}/activity?page=${page}&limit=${pageSize}`
        )
        if (res.ok) {
          const data = await res.json()
          setActivities(data.activities)
          setTotal(data.total)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [businessId, page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No activity recorded
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {activities.map((a) => (
              <div key={a.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">
                      {a.activityType.replace(/_/g, " ")}
                    </span>
                    {a.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {a.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                    {a.performedByEmail && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {a.performedByEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} entries)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
