"use client"

import { Badge } from "@/components/ui/badge"
import type { PlanTier } from "@/lib/stripe/config"

const tierStyles: Record<PlanTier, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
}

const tierLabels: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
}

export function PlanBadge({ tier }: { tier: PlanTier }) {
  return (
    <Badge className={tierStyles[tier]}>
      {tierLabels[tier]}
    </Badge>
  )
}
