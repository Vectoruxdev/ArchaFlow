"use client"

import { Badge } from "@/components/ui/badge"
import type { PlanTier } from "@/lib/stripe/config"

const tierStyles: Record<PlanTier, string> = {
  free: "bg-[--af-bg-surface-alt] text-[--af-text-secondary] dark:bg-warm-800 dark:text-[--af-text-muted]",
  pro: "bg-[--af-info-bg] text-[--af-info-text]",
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
