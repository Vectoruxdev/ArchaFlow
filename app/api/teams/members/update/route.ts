import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      userId,
      userRoleId,
      firstName,
      lastName,
      phone,
      avatarUrl,
      position,
      roleId,
    } = body as {
      userId?: string
      userRoleId?: string
      firstName?: string
      lastName?: string
      phone?: string
      avatarUrl?: string
      position?: string
      roleId?: string
    }

    if (!userId || !userRoleId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, userRoleId" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    const { data: targetRole, error: roleFetchError } = await admin
      .from("user_roles")
      .select("id, business_id, role_id, roles(name)")
      .eq("id", userRoleId)
      .eq("user_id", userId)
      .single()

    if (roleFetchError || !targetRole) {
      return NextResponse.json(
        { error: "Member or role not found" },
        { status: 404 }
      )
    }

    const businessId = targetRole.business_id
    const targetRoleName = (targetRole as any).roles?.name

    const { data: callerRole } = await admin
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    const callerRoleName = (callerRole as any)?.roles?.name
    const isOwnerOrAdmin =
      callerRoleName === "Owner" || callerRoleName === "Administrator"
    if (!isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Only owners and admins can update member details" },
        { status: 403 }
      )
    }

    if (targetRoleName === "Owner" && callerRoleName !== "Owner") {
      return NextResponse.json(
        { error: "Only the owner can update another owner" },
        { status: 403 }
      )
    }

    const fullName =
      [firstName, lastName].filter(Boolean).join(" ").trim() || null

    const { error: profileError } = await admin
      .from("user_profiles")
      .update({
        first_name: firstName != null ? (String(firstName).trim() || null) : undefined,
        last_name: lastName != null ? (String(lastName).trim() || null) : undefined,
        phone: phone != null ? (String(phone).trim() || null) : undefined,
        avatar_url: avatarUrl != null ? (String(avatarUrl).trim() || null) : undefined,
        full_name: fullName,
      })
      .eq("id", userId)

    if (profileError) {
      console.error("Error updating user_profiles:", profileError)
      return NextResponse.json(
        { error: profileError.message || "Failed to update profile" },
        { status: 500 }
      )
    }

    const rolePayload: { position?: string | null; role_id?: string } = {
      position: position != null ? (String(position).trim() || null) : undefined,
    }
    if (
      roleId != null &&
      targetRoleName !== "Owner" &&
      (callerRoleName === "Owner" || callerRoleName === "Administrator")
    ) {
      rolePayload.role_id = roleId
    }

    if (Object.keys(rolePayload).length > 0) {
      const { error: roleUpdateError } = await admin
        .from("user_roles")
        .update(rolePayload)
        .eq("id", userRoleId)

      if (roleUpdateError) {
        console.error("Error updating user_roles:", roleUpdateError)
        return NextResponse.json(
          { error: roleUpdateError.message || "Failed to update role" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Teams members update API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
