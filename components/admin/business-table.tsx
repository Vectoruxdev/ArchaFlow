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
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    trialing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
                Plan
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
                Members
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
                Owner
              </th>
              <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((biz) => (
              <tr
                key={biz.id}
                onClick={() => router.push(`/businesses/${biz.id}`)}
                className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-3 text-sm font-medium">{biz.name}</td>
                <td className="px-6 py-3">
                  <PlanBadge tier={biz.planTier} />
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={biz.subscriptionStatus} />
                </td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {biz.memberCount}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {biz.ownerEmail || "—"}
                </td>
                <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(biz.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {businesses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
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
