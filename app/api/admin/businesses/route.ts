import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { AdminBusinessRow } from "@/lib/admin/types"

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdmin()
  if (isVerifyError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = request.nextUrl
  const search = searchParams.get("search") || ""
  const planTier = searchParams.get("plan_tier") || ""
  const status = searchParams.get("status") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "25")
  const sort = searchParams.get("sort") || "created_at"
  const order = searchParams.get("order") || "desc"

  const admin = getSupabaseAdmin()
  const offset = (page - 1) * limit

  // Build query
  let query = admin
    .from("businesses")
    .select(
      `id, name, plan_tier, subscription_status, seat_count, ai_credits_used,
       is_founding_member, stripe_customer_id, created_at`,
      { count: "exact" }
    )

  if (search) {
    query = query.ilike("name", `%${search}%`)
  }
  if (planTier) {
    query = query.eq("plan_tier", planTier)
  }
  if (status) {
    query = query.eq("subscription_status", status)
  }

  const ascending = order === "asc"
  query = query
    .order(sort, { ascending })
    .range(offset, offset + limit - 1)

  const { data: businessRows, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get member counts and owner emails for all returned businesses
  const businessIds = (businessRows || []).map((b: any) => b.id)
  let memberCountMap: Record<string, number> = {}
  let ownerEmailMap: Record<string, string> = {}

  if (businessIds.length > 0) {
    // Member counts
    const { data: roles } = await admin
      .from("user_roles")
      .select("business_id")
      .in("business_id", businessIds)

    if (roles) {
      for (const r of roles) {
        memberCountMap[r.business_id] = (memberCountMap[r.business_id] || 0) + 1
      }
    }

    // Owner emails: find the "Owner" role id, then get owner user_ids
    const { data: ownerRole } = await admin
      .from("roles")
      .select("id")
      .eq("name", "Owner")
      .single()

    if (ownerRole) {
      const { data: ownerAssignments } = await admin
        .from("user_roles")
        .select("business_id, user_id")
        .in("business_id", businessIds)
        .eq("role_id", ownerRole.id)

      if (ownerAssignments) {
        // Email lives in auth.users, not user_profiles
        for (const o of ownerAssignments) {
          if (o.user_id) {
            const { data: { user: ownerUser } } = await admin.auth.admin.getUserById(o.user_id)
            if (ownerUser?.email) {
              ownerEmailMap[o.business_id] = ownerUser.email
            }
          }
        }
      }
    }
  }

  const businesses: AdminBusinessRow[] = (businessRows || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    planTier: b.plan_tier || "free",
    subscriptionStatus: b.subscription_status,
    memberCount: memberCountMap[b.id] || 0,
    ownerEmail: ownerEmailMap[b.id] || null,
    seatCount: b.seat_count || 0,
    aiCreditsUsed: b.ai_credits_used || 0,
    isFoundingMember: b.is_founding_member || false,
    stripeCustomerId: b.stripe_customer_id,
    createdAt: b.created_at,
  }))

  return NextResponse.json({
    businesses,
    total: count || 0,
    page,
    pageSize: limit,
  })
}
