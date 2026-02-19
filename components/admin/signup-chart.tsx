"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface SignupChartProps {
  data: { month: string; count: number }[]
}

export function SignupChart({ data }: SignupChartProps) {
  // Format month labels (2025-01 → Jan)
  const formatted = data.map((d) => {
    const [, m] = d.month.split("-")
    const date = new Date(2000, parseInt(m) - 1)
    return {
      ...d,
      label: date.toLocaleString("default", { month: "short" }),
    }
  })

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
        Signups Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis
              dataKey="label"
              className="text-xs"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              className="text-xs"
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
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.1}
              name="Signups"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
