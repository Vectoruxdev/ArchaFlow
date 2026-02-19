import { NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { PLAN_CONFIGS } from "@/lib/stripe/config"
import type { AdminDashboardStats, AdminBusinessRow } from "@/lib/admin/types"

export async function GET() {
  const auth = await verifySuperAdmin()
  if (isVerifyError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = getSupabaseAdmin()

  // Run queries in parallel
  const [
    businessesRes,
    usersRes,
    planBreakdownRes,
    recentBusinessesRes,
    signupsRes,
  ] = await Promise.all([
    // Total businesses
    admin.from("businesses").select("*", { count: "exact", head: true }),

    // Total users
    admin.from("user_profiles").select("*", { count: "exact", head: true }),

    // Plan breakdown
    admin
      .from("businesses")
      .select("plan_tier, subscription_status"),

    // Recent businesses (last 5)
    admin
      .from("businesses")
      .select(
        `id, name, plan_tier, subscription_status, seat_count, ai_credits_used,
         is_founding_member, stripe_customer_id, created_at`
      )
      .order("created_at", { ascending: false })
      .limit(5),

    // Signups by month (last 12 months)
    admin.rpc("get_signups_by_month").select("*"),
  ])

  const totalBusinesses = businessesRes.count || 0
  const totalUsers = usersRes.count || 0

  // Calculate plan breakdown and MRR
  const businesses = planBreakdownRes.data || []
  const planCounts: Record<string, number> = {}
  let activeSubscriptions = 0
  let mrr = 0

  for (const b of businesses) {
    const tier = b.plan_tier || "free"
    planCounts[tier] = (planCounts[tier] || 0) + 1

    if (b.subscription_status === "active" || b.subscription_status === "trialing") {
      activeSubscriptions++
      const config = PLAN_CONFIGS[tier as keyof typeof PLAN_CONFIGS]
      if (config) {
        mrr += config.basePrice
      }
    }
  }

  const planBreakdown = Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
  }))

  // Get member counts for recent businesses
  const recentBusinessIds = (recentBusinessesRes.data || []).map((b: any) => b.id)
  let memberCountMap: Record<string, number> = {}

  if (recentBusinessIds.length > 0) {
    const { data: memberCounts } = await admin
      .from("user_roles")
      .select("business_id")
      .in("business_id", recentBusinessIds)

    if (memberCounts) {
      for (const mc of memberCounts) {
        memberCountMap[mc.business_id] = (memberCountMap[mc.business_id] || 0) + 1
      }
    }
  }

  const recentBusinesses: AdminBusinessRow[] = (recentBusinessesRes.data || []).map(
    (b: any) => ({
      id: b.id,
      name: b.name,
      planTier: b.plan_tier || "free",
      subscriptionStatus: b.subscription_status,
      memberCount: memberCountMap[b.id] || 0,
      ownerEmail: null,
      seatCount: b.seat_count || 0,
      aiCreditsUsed: b.ai_credits_used || 0,
      isFoundingMember: b.is_founding_member || false,
      stripeCustomerId: b.stripe_customer_id,
      createdAt: b.created_at,
    })
  )

  // Signups over time — fallback if RPC doesn't exist
  let signupsOverTime: { month: string; count: number }[] = []
  if (signupsRes.data && !signupsRes.error) {
    signupsOverTime = signupsRes.data.map((row: any) => ({
      month: row.month,
      count: row.count,
    }))
  } else {
    // Manual calculation from businesses created_at
    const { data: allBusinesses } = await admin
      .from("businesses")
      .select("created_at")
      .order("created_at", { ascending: true })

    if (allBusinesses) {
      const monthMap: Record<string, number> = {}
      for (const b of allBusinesses) {
        const date = new Date(b.created_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        monthMap[key] = (monthMap[key] || 0) + 1
      }
      // Get last 12 months
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        signupsOverTime.push({ month: key, count: monthMap[key] || 0 })
      }
    }
  }

  const stats: AdminDashboardStats = {
    totalBusinesses,
    totalUsers,
    mrr,
    activeSubscriptions,
    planBreakdown,
    signupsOverTime,
    recentBusinesses,
  }

  return NextResponse.json(stats)
}
