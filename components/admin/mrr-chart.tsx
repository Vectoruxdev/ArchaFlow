"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface MrrChartProps {
  data: { plan: string; count: number }[]
}

const planColors: Record<string, string> = {
  free: "#9ca3af",
  pro: "#3b82f6",
  enterprise: "#8b5cf6",
}

export function MrrChart({ data }: MrrChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.plan.charAt(0).toUpperCase() + d.plan.slice(1),
  }))

  return (
    <div className="bg-[--af-bg-surface] dark:bg-warm-900 border border-[--af-border-default] rounded-lg p-6">
      <h3 className="text-sm font-medium text-[--af-text-muted] mb-4">
        Plan Distribution
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-[--af-border-default] dark:stroke-warm-800" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #fff)",
                border: "1px solid #e5e7eb",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
              }}
            />
            <Bar dataKey="count" name="Businesses" radius={[4, 4, 0, 0]}>
              {formatted.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={planColors[entry.plan] || "#6b7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
