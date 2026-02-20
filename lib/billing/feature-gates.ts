import { PLAN_CONFIGS, type PlanTier } from "@/lib/stripe/config"

export function canAddUser(tier: PlanTier, currentSeats: number): boolean {
  if (tier === "free") return currentSeats < 1
  // Paid tiers can add users (billed per extra seat)
  return true
}

export function canCreateProject(tier: PlanTier, currentProjects: number): boolean {
  const config = PLAN_CONFIGS[tier]
  if (config.maxProjects === -1) return true
  return currentProjects < config.maxProjects
}

export function canUseAI(tier: PlanTier): boolean {
  return PLAN_CONFIGS[tier].hasAI
}

export function canUseSSO(tier: PlanTier): boolean {
  return PLAN_CONFIGS[tier].hasSSO
}

export function canUseAPI(tier: PlanTier): boolean {
  return PLAN_CONFIGS[tier].hasAPI
}

export function getStorageLimitBytes(tier: PlanTier): number {
  const gb = PLAN_CONFIGS[tier].storageGB
  if (gb === -1) return Infinity
  return gb * 1024 * 1024 * 1024
}

export function getProjectLimit(tier: PlanTier): number {
  return PLAN_CONFIGS[tier].maxProjects
}

export function getAICreditsLimit(tier: PlanTier): number {
  return PLAN_CONFIGS[tier].aiCredits
}

export function getIncludedSeats(tier: PlanTier): number {
  return PLAN_CONFIGS[tier].includedSeats
}

export function canCreateInvoice(tier: PlanTier, currentMonthCount: number): boolean {
  const config = PLAN_CONFIGS[tier]
  if (config.maxInvoicesPerMonth === -1) return true
  return currentMonthCount < config.maxInvoicesPerMonth
}

export function getInvoiceLimit(tier: PlanTier): number {
  return PLAN_CONFIGS[tier].maxInvoicesPerMonth
}
