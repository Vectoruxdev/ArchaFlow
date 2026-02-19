"use client"

import { useEffect, useState } from "react"
import { Building2, Users, DollarSign, CreditCard } from "lucide-react"
import { StatsCard } from "@/components/admin/stats-card"
import { SignupChart } from "@/components/admin/signup-chart"
import { MrrChart } from "@/components/admin/mrr-chart"
import { PlanBadge } from "@/components/billing/plan-badge"
import type { AdminDashboardStats } from "@/lib/admin/types"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (res.ok) {
          setStats(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 h-28 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-500">Failed to load dashboard stats.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Businesses"
          value={stats.totalBusinesses}
          icon={Building2}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatsCard
          title="MRR"
          value={`$${stats.mrr.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SignupChart data={stats.signupsOverTime} />
        <MrrChart data={stats.planBreakdown} />
      </div>

      {/* Recent businesses */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Recent Businesses
          </h3>
        </div>
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
                  Members
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-6 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBusinesses.map((biz) => (
                <tr
                  key={biz.id}
                  className="border-b border-gray-100 dark:border-gray-800/50 last:border-0"
                >
                  <td className="px-6 py-3 text-sm font-medium">
                    {biz.name}
                  </td>
                  <td className="px-6 py-3">
                    <PlanBadge tier={biz.planTier} />
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {biz.memberCount}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(biz.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {stats.recentBusinesses.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No businesses yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
