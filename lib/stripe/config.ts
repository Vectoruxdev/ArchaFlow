export type PlanTier = "free" | "pro" | "enterprise"

export interface PlanConfig {
  name: string
  tier: PlanTier
  basePrice: number
  seatPrice: number
  includedSeats: number
  maxProjects: number // -1 = unlimited
  storageGB: number // -1 = unlimited
  aiCredits: number
  hasAI: boolean
  hasSSO: boolean
  hasAPI: boolean
  maxInvoicesPerMonth: number // -1 = unlimited
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    name: "Free",
    tier: "free",
    basePrice: 0,
    seatPrice: 0,
    includedSeats: 1,
    maxProjects: 50,
    storageGB: 1,
    aiCredits: 0,
    hasAI: false,
    hasSSO: false,
    hasAPI: false,
    maxInvoicesPerMonth: -1,
  },
  pro: {
    name: "Pro",
    tier: "pro",
    basePrice: 29,
    seatPrice: 12,
    includedSeats: 3,
    maxProjects: -1,
    storageGB: 100,
    aiCredits: 500,
    hasAI: true,
    hasSSO: false,
    hasAPI: false,
    maxInvoicesPerMonth: -1,
  },
  enterprise: {
    name: "Enterprise",
    tier: "enterprise",
    basePrice: 79,
    seatPrice: 10,
    includedSeats: 10,
    maxProjects: -1,
    storageGB: -1,
    aiCredits: 2000,
    hasAI: true,
    hasSSO: true,
    hasAPI: true,
    maxInvoicesPerMonth: -1,
  },
}

// Stripe Price IDs from environment
export function getStripePriceIds() {
  return {
    proBase: process.env.STRIPE_PRO_BASE_PRICE_ID!,
    proSeat: process.env.STRIPE_PRO_SEAT_PRICE_ID!,
    enterpriseBase: process.env.STRIPE_ENTERPRISE_BASE_PRICE_ID!,
    enterpriseSeat: process.env.STRIPE_ENTERPRISE_SEAT_PRICE_ID!,
  }
}

export function getPriceIdsForTier(tier: PlanTier) {
  const ids = getStripePriceIds()
  switch (tier) {
    case "pro":
      return { base: ids.proBase, seat: ids.proSeat }
    case "enterprise":
      return { base: ids.enterpriseBase, seat: ids.enterpriseSeat }
    default:
      return null
  }
}

export function getFoundingCouponId() {
  return process.env.STRIPE_FOUNDING_COUPON_ID || ""
}
