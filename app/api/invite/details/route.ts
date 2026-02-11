import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: invitation, error } = await supabase
      .from("workspace_invitations")
      .select("email, business_id, status, expires_at")
      .eq("token", token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    const expiresAt = invitation.expires_at
      ? new Date(invitation.expires_at).getTime()
      : 0
    if (expiresAt > 0 && expiresAt < Date.now()) {
      return NextResponse.json(
        { error: "Invitation has expired", status: "expired" },
        { status: 404 }
      )
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", invitation.business_id)
      .single()

    const workspaceName = business?.name || "this workspace"

    if (invitation.status !== "pending") {
      return NextResponse.json({
        workspaceName,
        email: invitation.email || "",
        status: invitation.status,
        businessId: invitation.business_id,
      })
    }

    return NextResponse.json({
      workspaceName,
      email: invitation.email || "",
      status: "pending",
      businessId: invitation.business_id,
    })
  } catch (err: any) {
    console.error("Invite details API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
