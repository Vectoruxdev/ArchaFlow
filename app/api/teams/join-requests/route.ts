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

    // Verify caller is a member of the workspace
    const { data: membership } = await admin
      .from("user_roles")
      .select("role_id, roles:role_id(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    // Get pending join requests
    const { data: requests, error: fetchError } = await admin
      .from("workspace_join_requests")
      .select("id, user_id, message, status, created_at, role_id, roles:role_id(name)")
      .eq("business_id", businessId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ joinRequests: [] })
    }

    // Get user profiles and emails for requesters
    const userIds = requests.map((r: any) => r.user_id)

    const { data: profiles } = await admin
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds)

    const profilesMap: Record<string, any> = {}
    for (const p of profiles || []) {
      profilesMap[p.id] = p
    }

    const emailById: Record<string, string> = {}
    await Promise.all(
      userIds.map(async (id: string) => {
        const { data } = await admin.auth.admin.getUserById(id)
        if (data?.user?.email) emailById[id] = data.user.email
      })
    )

    const joinRequests = requests.map((r: any) => {
      const profile = profilesMap[r.user_id] || {}
      return {
        id: r.id,
        userId: r.user_id,
        email: emailById[r.user_id] || "",
        fullName: profile.full_name || "",
        avatarUrl: profile.avatar_url || "",
        message: r.message,
        roleName: r.roles?.name || "Editor",
        status: r.status,
        createdAt: r.created_at,
      }
    })

    return NextResponse.json({ joinRequests })
  } catch (err: any) {
    console.error("Teams join requests error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
