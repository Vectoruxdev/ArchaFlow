"use client"

import { useRouter } from "next/navigation"
import { PlanBadge } from "@/components/billing/plan-badge"
import { Badge } from "@/components/ui/badge"
import type { AdminBusinessRow } from "@/lib/admin/types"

interface BusinessTableProps {
  businesses: AdminBusinessRow[]
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="secondary">No subscription</Badge>

  const styles: Record<string, string> = {
    active: "bg-[--af-success-bg] text-[--af-success-text]",
    trialing: "bg-[--af-warning-bg] text-[--af-warning-text]",
    canceled: "bg-[--af-danger-bg] text-[--af-danger-text]",
    past_due: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  }

  return (
    <Badge className={styles[status] || ""}>
      {status.replace("_", " ")}
    </Badge>
  )
}

export function BusinessTable({ businesses }: BusinessTableProps) {
  const router = useRouter()

  return (
    <div className="bg-[--af-bg-surface] dark:bg-warm-900 border border-[--af-border-default] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[--af-border-default]">
              <th className="text-left text-xs font-medium text-[--af-text-muted] px-6 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-[--af-text-muted] px-6 py-3">
                Plan
              </th>
              <th className="text-left text-xs font-medium text-[--af-text-muted] px-6 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-[--af-text-muted] px-6 py-3">
                Members
              </th>
              <th className="text-left text-xs font-medium text-[--af-text-muted] px-6 py-3">
                Owner
              </th>
              <th className="text-left text-xs font-medium text-[--af-text-muted] px-6 py-3">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((biz) => (
              <tr
                key={biz.id}
                onClick={() => router.push(`/businesses/${biz.id}`)}
                className="border-b border-[--af-border-default]/50 dark:border-warm-800/50 last:border-0 hover:bg-[--af-bg-canvas] dark:hover:bg-warm-800/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-3 text-sm font-medium">{biz.name}</td>
                <td className="px-6 py-3">
                  <PlanBadge tier={biz.planTier} />
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={biz.subscriptionStatus} />
                </td>
                <td className="px-6 py-3 text-sm text-[--af-text-secondary]">
                  {biz.memberCount}
                </td>
                <td className="px-6 py-3 text-sm text-[--af-text-secondary]">
                  {biz.ownerEmail || "—"}
                </td>
                <td className="px-6 py-3 text-sm text-[--af-text-secondary]">
                  {new Date(biz.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {businesses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-[--af-text-muted]"
                >
                  No businesses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
