import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { AdminMember } from "@/lib/admin/types"

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

  // Get user_roles for the business
  const { data: userRoles, error } = await admin
    .from("user_roles")
    .select("user_id, role_id, assigned_at")
    .eq("business_id", businessId)
    .order("assigned_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!userRoles || userRoles.length === 0) {
    return NextResponse.json({ members: [] })
  }

  // Get all role names
  const roleIds = [...new Set(userRoles.map((ur) => ur.role_id))]
  const { data: roles } = await admin
    .from("roles")
    .select("id, name")
    .in("id", roleIds)

  const roleMap: Record<string, string> = {}
  if (roles) {
    for (const r of roles) {
      roleMap[r.id] = r.name
    }
  }

  // Get all user profiles
  const userIds = userRoles.map((ur) => ur.user_id)
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, email, full_name, position")
    .in("id", userIds)

  const profileMap: Record<string, any> = {}
  if (profiles) {
    for (const p of profiles) {
      profileMap[p.id] = p
    }
  }

  const members: AdminMember[] = userRoles.map((ur) => {
    const profile = profileMap[ur.user_id] || {}
    return {
      userId: ur.user_id,
      email: profile.email || "",
      fullName: profile.full_name || null,
      roleName: roleMap[ur.role_id] || "Unknown",
      position: profile.position || null,
      assignedAt: ur.assigned_at,
    }
  })

  return NextResponse.json({ members })
}
