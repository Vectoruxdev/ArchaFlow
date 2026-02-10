import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // 1. Authenticate the caller
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse body
    const body = await request.json()
    const { invitationId } = body

    if (!invitationId) {
      return NextResponse.json(
        { error: "Missing required field: invitationId" },
        { status: 400 }
      )
    }

    // 3. Get the invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from("workspace_invitations")
      .select("*")
      .eq("id", invitationId)
      .single()

    if (invError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      )
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      )
    }

    // 4. Verify caller is a member of this workspace with Owner/Admin role
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("id, role_id, roles!inner(name)")
      .eq("user_id", user.id)
      .eq("business_id", invitation.business_id)
      .single()

    if (!callerRole) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    const roleName = (callerRole as any).roles?.name
    if (!["Owner", "Admin"].includes(roleName)) {
      return NextResponse.json(
        { error: "Only Owners and Admins can resend invitations" },
        { status: 403 }
      )
    }

    // 5. Reset expiry
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error: updateError } = await supabaseAdmin
      .from("workspace_invitations")
      .update({ expires_at: newExpiry })
      .eq("id", invitationId)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update invitation" },
        { status: 500 }
      )
    }

    // 6. Re-send the email: use signInWithOtp so Supabase actually sends the magic link email
    // (generateLink only returns a link and does not send email)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const redirectTo = `${siteUrl}/invite/accept?token=${invitation.token}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server missing Supabase URL or anon key" },
        { status: 500 }
      )
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: otpError } = await authClient.auth.signInWithOtp({
      email: invitation.email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    })

    if (otpError) {
      console.error("Resend signInWithOtp error:", otpError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send invitation email: " + otpError.message,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Invitation resent successfully",
    })
  } catch (error: any) {
    console.error("Resend invite API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
