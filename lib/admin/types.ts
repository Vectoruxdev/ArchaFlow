import type { PlanTier } from "@/lib/stripe/config"

export interface AdminBusinessRow {
  id: string
  name: string
  planTier: PlanTier
  subscriptionStatus: string | null
  memberCount: number
  ownerEmail: string | null
  seatCount: number
  aiCreditsUsed: number
  isFoundingMember: boolean
  stripeCustomerId: string | null
  createdAt: string
}

export interface AdminMember {
  userId: string
  email: string
  fullName: string | null
  roleName: string
  position: string | null
  assignedAt: string
}

export interface AdminBusinessDetail extends AdminBusinessRow {
  members: AdminMember[]
  recentActivity: AdminActivityEntry[]
}

export interface AdminActivityEntry {
  id: string
  activityType: string
  description: string
  performedBy: string | null
  performedByEmail: string | null
  createdAt: string
}

export interface AdminDashboardStats {
  totalBusinesses: number
  totalUsers: number
  mrr: number
  activeSubscriptions: number
  planBreakdown: { plan: string; count: number }[]
  signupsOverTime: { month: string; count: number }[]
  recentBusinesses: AdminBusinessRow[]
}
