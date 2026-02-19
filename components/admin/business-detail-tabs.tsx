"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PlanBadge } from "@/components/billing/plan-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ExternalLink, Star } from "lucide-react"
import type { AdminMember, AdminActivityEntry } from "@/lib/admin/types"

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
  createdAt: string
  recentActivity: AdminActivityEntry[]
}

interface BusinessDetailTabsProps {
  business: BusinessDetailData
}

export function BusinessDetailTabs({ business }: BusinessDetailTabsProps) {
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
        <BillingTab business={business} />
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

function BillingTab({ business }: { business: BusinessDetailData }) {
  const stripeBaseUrl = "https://dashboard.stripe.com"

  return (
    <div className="mt-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Billing Details
      </h3>
      <InfoRow
        label="Plan"
        value={<PlanBadge tier={business.planTier} />}
      />
      <InfoRow
        label="Subscription Status"
        value={business.subscriptionStatus || "None"}
      />
      <InfoRow label="Seat Count" value={business.seatCount} />
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
  )
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
