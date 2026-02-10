import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = request.nextUrl.searchParams.get("businessId")
    if (!businessId) {
      return NextResponse.json(
        { error: "Missing required query: businessId" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    const { data: roleRows, error: rolesError } = await admin
      .from("user_roles")
      .select("id, user_id, role_id, position, assigned_at, roles:role_id(name)")
      .eq("business_id", businessId)

    if (rolesError) {
      console.error("Error fetching user_roles:", rolesError)
      return NextResponse.json(
        { error: rolesError.message || "Failed to load members" },
        { status: 500 }
      )
    }

    const userIds = [...new Set((roleRows || []).map((r: any) => r.user_id))]
    let profilesMap: Record<string, { first_name?: string; last_name?: string; full_name?: string; phone?: string; avatar_url?: string }> = {}
    if (userIds.length > 0) {
      const { data: profileRows } = await admin
        .from("user_profiles")
        .select("id, first_name, last_name, full_name, phone, avatar_url")
        .in("id", userIds)
      for (const p of profileRows || []) {
        profilesMap[p.id] = p
      }
    }

    const emailById: Record<string, string> = {}
    await Promise.all(
      userIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id)
        if (data?.user?.email) emailById[id] = data.user.email
      })
    )

    const members = (roleRows || []).map((r: any) => {
      const profile = profilesMap[r.user_id] || {}
      let firstName = profile.first_name || ""
      let lastName = profile.last_name || ""
      if (!firstName && !lastName && profile.full_name) {
        const parts = profile.full_name.split(" ")
        firstName = parts[0] || ""
        lastName = parts.slice(1).join(" ") || ""
      }
      return {
        userId: r.user_id,
        userRoleId: r.id,
        email: emailById[r.user_id] || "",
        firstName,
        lastName,
        phone: profile.phone || "",
        avatarUrl: profile.avatar_url || "",
        roleName: r.roles?.name || "Unknown",
        roleId: r.role_id,
        position: r.position || "",
        assignedAt: r.assigned_at,
        type: "member" as const,
      }
    })

    members.sort((a, b) => {
      if (a.roleName === "Owner" && b.roleName !== "Owner") return -1
      if (b.roleName === "Owner" && a.roleName !== "Owner") return 1
      const nameA = `${a.firstName} ${a.lastName}`.trim().toLowerCase()
      const nameB = `${b.firstName} ${b.lastName}`.trim().toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json(members)
  } catch (err: any) {
    console.error("Teams members API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
