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

  // Get user_roles for the business (position lives on user_roles)
  const { data: userRoles, error } = await admin
    .from("user_roles")
    .select("user_id, role_id, position, assigned_at")
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

  // Get user profiles (first_name, last_name — NOT email or position)
  const userIds = userRoles.map((ur) => ur.user_id)
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, first_name, last_name")
    .in("id", userIds)

  const profileMap: Record<string, any> = {}
  if (profiles) {
    for (const p of profiles) {
      profileMap[p.id] = p
    }
  }

  // Get emails from auth.users via admin API
  const emailMap: Record<string, string> = {}
  const { data: { users } } = await admin.auth.admin.listUsers()
  if (users) {
    for (const u of users) {
      if (userIds.includes(u.id)) {
        emailMap[u.id] = u.email || ""
      }
    }
  }

  const members: AdminMember[] = userRoles.map((ur) => {
    const profile = profileMap[ur.user_id] || {}
    const firstName = profile.first_name || ""
    const lastName = profile.last_name || ""
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || null
    return {
      userId: ur.user_id,
      email: emailMap[ur.user_id] || "",
      fullName,
      roleName: roleMap[ur.role_id] || "Unknown",
      position: ur.position || null,
      assignedAt: ur.assigned_at,
    }
  })

  return NextResponse.json({ members })
}
