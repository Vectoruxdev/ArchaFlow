import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

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

    const { requestId, action } = await request.json()

    if (!requestId || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "requestId and action (accept/decline) are required" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Get the join request
    const { data: joinRequest, error: fetchError } = await admin
      .from("workspace_join_requests")
      .select("id, business_id, user_id, role_id, status")
      .eq("id", requestId)
      .single()

    if (fetchError || !joinRequest) {
      return NextResponse.json(
        { error: "Join request not found" },
        { status: 404 }
      )
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been reviewed" },
        { status: 400 }
      )
    }

    // Verify caller is Owner/Admin of the workspace
    const { data: callerRole } = await admin
      .from("user_roles")
      .select("role_id, roles:role_id(name)")
      .eq("user_id", user.id)
      .eq("business_id", joinRequest.business_id)
      .single()

    const callerRoleName = (callerRole as any)?.roles?.name
    if (!callerRoleName || !["Owner", "Admin"].includes(callerRoleName)) {
      return NextResponse.json(
        { error: "Only workspace Owners and Admins can review join requests" },
        { status: 403 }
      )
    }

    if (action === "accept") {
      // Get a role for the new member (use request's role or default to Editor)
      let targetRoleId = joinRequest.role_id
      if (!targetRoleId) {
        const { data: editorRole } = await admin
          .from("roles")
          .select("id")
          .eq("business_id", joinRequest.business_id)
          .eq("name", "Editor")
          .single()
        targetRoleId = editorRole?.id
      }

      if (!targetRoleId) {
        return NextResponse.json(
          { error: "No suitable role found for the new member" },
          { status: 500 }
        )
      }

      // Create user_roles entry
      const { error: addError } = await admin.from("user_roles").insert({
        user_id: joinRequest.user_id,
        role_id: targetRoleId,
        business_id: joinRequest.business_id,
      })

      if (addError) {
        return NextResponse.json(
          { error: addError.message },
          { status: 500 }
        )
      }

      // Record activity
      // Get requester email for the activity message
      const { data: requesterData } = await admin.auth.admin.getUserById(
        joinRequest.user_id
      )
      const requesterEmail = requesterData?.user?.email || "A user"

      await admin.from("workspace_activities").insert({
        business_id: joinRequest.business_id,
        user_id: user.id,
        activity_type: "member_join_request_accepted",
        entity_type: "user",
        entity_id: joinRequest.user_id,
        message: `${requesterEmail} join request accepted`,
        metadata: { accepted_by: user.id },
      })
    }

    // Update the request status
    const { error: updateError } = await admin
      .from("workspace_join_requests")
      .update({
        status: action === "accept" ? "accepted" : "declined",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Join request respond error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
