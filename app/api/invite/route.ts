import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { canAddUser } from "@/lib/billing/feature-gates"
import type { PlanTier } from "@/lib/stripe/config"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

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
    const { email, roleId, businessId, position, message } = body

    if (!email || !roleId || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields: email, roleId, businessId" },
        { status: 400 }
      )
    }

    // 3. Verify caller is a member of this workspace with Owner/Admin role
    const { data: callerRole, error: callerError } = await supabaseAdmin
      .from("user_roles")
      .select("id, role_id, roles!inner(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (callerError || !callerRole) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    const roleName = (callerRole as any).roles?.name
    if (!["Owner", "Admin"].includes(roleName)) {
      return NextResponse.json(
        { error: "Only Owners and Admins can send invitations" },
        { status: 403 }
      )
    }

    // 4. Check seat limits based on plan tier
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("plan_tier, seat_count")
      .eq("id", businessId)
      .single()

    if (business) {
      const tier = (business.plan_tier || "free") as PlanTier
      const seats = business.seat_count || 1
      if (!canAddUser(tier, seats)) {
        return NextResponse.json(
          { error: "Your plan's seat limit has been reached. Please upgrade to add more team members." },
          { status: 403 }
        )
      }
    }

    // 5. Check if there's already an invitation for this email in this workspace
    const { data: existingInvite } = await supabaseAdmin
      .from("workspace_invitations")
      .select("id, status, token")
      .eq("business_id", businessId)
      .eq("email", email.toLowerCase().trim())
      .single()

    // 5. Check if invitee is already a member of this workspace (must block in all cases)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
    )

    if (existingUser) {
      const { data: existingMembership } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("business_id", businessId)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: "This user is already a member of this workspace" },
          { status: 409 }
        )
      }
    }

    // 6. If pending invite exists, resend (update + email) instead of 409
    if (existingInvite?.status === "pending") {
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: invitation, error: updateError } = await supabaseAdmin
        .from("workspace_invitations")
        .update({
          role_id: roleId,
          position: position || null,
          message: message || null,
          expires_at: newExpiresAt,
        })
        .eq("id", existingInvite.id)
        .select("*, token")
        .single()

      if (updateError || !invitation) {
        console.error("Error updating invitation for resend:", updateError)
        return NextResponse.json(
          { error: "Failed to update invitation: " + (updateError?.message ?? "unknown") },
          { status: 500 }
        )
      }

      const { data: workspace } = await supabaseAdmin
        .from("businesses")
        .select("name")
        .eq("id", businessId)
        .single()
      const workspaceName = workspace?.name || "a workspace"
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
      const redirectTo = `${siteUrl}/invite/accept?token=${invitation.token}`

      if (!existingUser) {
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          email.toLowerCase().trim(),
          { redirectTo, data: { invitation_token: invitation.token, workspace_name: workspaceName } }
        )
        if (inviteError) {
          console.error("Error resending invite email:", inviteError)
          return NextResponse.json({
            invitation,
            emailSent: false,
            resent: true,
            warning: "Invitation updated but email failed to send: " + inviteError.message,
          })
        }
      } else {
        const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase().trim(),
          options: { redirectTo },
        })
        if (linkError) {
          console.error("Error generating magic link for resend:", linkError)
          return NextResponse.json({
            invitation,
            emailSent: false,
            resent: true,
            warning: "Invitation updated but email failed to send: " + linkError.message,
          })
        }
      }

      return NextResponse.json({ invitation, emailSent: true, resent: true })
    }

    if (existingInvite) {
      // Previously accepted/declined — delete so we can create a new one
      await supabaseAdmin
        .from("workspace_invitations")
        .delete()
        .eq("id", existingInvite.id)
    }

    // 7. Insert new invitation
    const { data: invitation, error: insertError } = await supabaseAdmin
      .from("workspace_invitations")
      .insert({
        business_id: businessId,
        email: email.toLowerCase().trim(),
        role_id: roleId,
        invited_by: user.id,
        position: position || null,
        message: message || null,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("*, token")
      .single()

    if (insertError) {
      console.error("Error inserting invitation:", insertError)
      return NextResponse.json(
        { error: "Failed to create invitation: " + insertError.message },
        { status: 500 }
      )
    }

    // 7. Get workspace name for the email
    const { data: workspace } = await supabaseAdmin
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single()

    const workspaceName = workspace?.name || "a workspace"

    // 8. Send the invite email via Supabase
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const redirectTo = `${siteUrl}/invite/accept?token=${invitation.token}`

    if (!existingUser) {
      // New user: Use Supabase inviteUserByEmail which creates account + sends email
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email.toLowerCase().trim(),
        {
          redirectTo,
          data: {
            invitation_token: invitation.token,
            workspace_name: workspaceName,
          },
        }
      )

      if (inviteError) {
        console.error("Error sending invite email:", inviteError)
        // Invitation record still exists, user can be re-sent
        return NextResponse.json({
          invitation,
          emailSent: false,
          warning: "Invitation created but email failed to send: " + inviteError.message,
        })
      }
    } else {
      // Existing user: Use magic link which sends an email
      const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase().trim(),
        options: {
          redirectTo,
        },
      })

      if (linkError) {
        console.error("Error generating magic link:", linkError)
        return NextResponse.json({
          invitation,
          emailSent: false,
          warning: "Invitation created but email failed to send: " + linkError.message,
        })
      }
    }

    // Record activity (non-blocking)
    supabaseAdmin.from("workspace_activities").insert({
      business_id: businessId,
      user_id: user.id,
      activity_type: "member_invited",
      entity_type: "workspace_invitation",
      entity_id: invitation.id,
      message: `${email.trim()} invited to the workspace`,
      metadata: { email: email.trim() },
    }).then(({ error }) => { if (error) console.error("[Activity] member_invited:", error) })

    return NextResponse.json({
      invitation,
      emailSent: true,
    })
  } catch (error: any) {
    console.error("Invite API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
