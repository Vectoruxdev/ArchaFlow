import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (isVerifyError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = getSupabaseAdmin()
  const businessId = params.id

  // Fetch business
  const { data: business, error } = await admin
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single()

  if (error || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  // Fetch member count
  const { count: memberCount } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)

  // Fetch owner email
  let ownerEmail: string | null = null
  const { data: ownerRoleDef } = await admin
    .from("roles")
    .select("id")
    .eq("name", "Owner")
    .single()

  if (ownerRoleDef) {
    const { data: ownerAssignment } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("business_id", businessId)
      .eq("role_id", ownerRoleDef.id)
      .limit(1)
      .single()

    if (ownerAssignment) {
      // Email lives in auth.users, not user_profiles
      const { data: { user: ownerUser } } = await admin.auth.admin.getUserById(ownerAssignment.user_id)
      if (ownerUser) {
        ownerEmail = ownerUser.email || null
      }
    }
  }

  // Fetch recent activity
  const { data: activity } = await admin
    .from("workspace_activities")
    .select("id, activity_type, description, performed_by, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get performer emails from auth.users
  const performerIds = [...new Set((activity || [])
    .map((a: any) => a.performed_by)
    .filter(Boolean))]
  let performerEmails: Record<string, string> = {}
  for (const pid of performerIds) {
    const { data: { user: pUser } } = await admin.auth.admin.getUserById(pid)
    if (pUser?.email) {
      performerEmails[pid] = pUser.email
    }
  }

  return NextResponse.json({
    id: business.id,
    name: business.name,
    planTier: business.plan_tier || "free",
    subscriptionStatus: business.subscription_status,
    memberCount: memberCount || 0,
    ownerEmail,
    seatCount: business.seat_count || 0,
    aiCreditsUsed: business.ai_credits_used || 0,
    isFoundingMember: business.is_founding_member || false,
    stripeCustomerId: business.stripe_customer_id,
    stripeSubscriptionId: business.stripe_subscription_id,
    createdAt: business.created_at,
    recentActivity: (activity || []).map((a: any) => ({
      id: a.id,
      activityType: a.activity_type,
      description: a.description,
      performedBy: a.performed_by,
      performedByEmail: performerEmails[a.performed_by] || null,
      createdAt: a.created_at,
    })),
  })
}
