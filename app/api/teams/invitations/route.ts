import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

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

    const { data: rows, error } = await admin
      .from("workspace_invitations")
      .select("id, email, role_id, position, message, invited_by, created_at, expires_at")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending invitations:", error)
      return NextResponse.json(
        { error: error.message || "Failed to load invitations" },
        { status: 500 }
      )
    }

    const roleIds = [...new Set((rows || []).map((r: any) => r.role_id))]
    let roleNames: Record<string, string> = {}
    if (roleIds.length > 0) {
      const { data: roles } = await admin
        .from("roles")
        .select("id, name")
        .in("id", roleIds)
      for (const r of roles || []) {
        roleNames[r.id] = r.name
      }
    }

    const invitations = (rows || []).map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      roleName: roleNames[inv.role_id] || "Unknown",
      roleId: inv.role_id,
      position: inv.position || "",
      message: inv.message || "",
      invitedBy: inv.invited_by,
      createdAt: inv.created_at,
      expiresAt: inv.expires_at,
    }))

    return NextResponse.json(invitations)
  } catch (err: any) {
    console.error("Teams invitations API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
