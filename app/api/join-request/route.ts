import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { canAddUser } from "@/lib/billing/feature-gates"
import { syncSeatsToStripe } from "@/lib/stripe/sync-seats"
import type { PlanTier } from "@/lib/stripe/config"

export const dynamic = "force-dynamic"

// POST: Create a join request
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

    const { businessId, roleId, message } = await request.json()

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Check user is not already a member
    const { data: existing } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "You are already a member of this workspace" },
        { status: 400 }
      )
    }

    // Check for existing pending request
    const { data: existingRequest } = await admin
      .from("workspace_join_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json(
          { error: "You already have a pending request for this workspace" },
          { status: 400 }
        )
      }
      // If declined, allow re-request by updating
      if (existingRequest.status === "declined") {
        await admin
          .from("workspace_join_requests")
          .update({
            status: "pending",
            message: message || null,
            reviewed_by: null,
            reviewed_at: null,
            created_at: new Date().toISOString(),
          })
          .eq("id", existingRequest.id)

        return NextResponse.json({ status: "pending" })
      }
    }

    // Check for auto-add by domain
    const { data: business } = await admin
      .from("businesses")
      .select("id, name, allowed_email_domains, auto_add_by_domain, plan_tier, seat_count")
      .eq("id", businessId)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      )
    }

    const userDomain = user.email?.split("@")[1]?.toLowerCase()
    const allowedDomains: string[] = Array.isArray(business.allowed_email_domains)
      ? business.allowed_email_domains
      : []
    const domainMatches =
      !!userDomain && allowedDomains.some((d: string) => d.toLowerCase() === userDomain)

    if (business.auto_add_by_domain && domainMatches) {
      // Check seat limits before auto-adding
      const tier = (business.plan_tier || "free") as PlanTier
      const seats = business.seat_count || 1
      if (!canAddUser(tier, seats)) {
        return NextResponse.json(
          { error: "This workspace has reached its seat limit. Please ask the owner to upgrade." },
          { status: 403 }
        )
      }

      // Auto-add: get default Editor role
      const { data: editorRole } = await admin
        .from("roles")
        .select("id")
        .eq("business_id", businessId)
        .eq("name", "Editor")
        .single()

      const targetRoleId = roleId || editorRole?.id
      if (!targetRoleId) {
        return NextResponse.json(
          { error: "No suitable role found" },
          { status: 500 }
        )
      }

      // Create user_roles directly
      const { error: addError } = await admin.from("user_roles").insert({
        user_id: user.id,
        role_id: targetRoleId,
        business_id: businessId,
      })

      if (addError) {
        return NextResponse.json(
          { error: addError.message },
          { status: 500 }
        )
      }

      // Sync seats to Stripe (non-blocking)
      syncSeatsToStripe(businessId).catch((err) =>
        console.error("[join-request] Seat sync error:", err)
      )

      // Record activity
      await admin.from("workspace_activities").insert({
        business_id: businessId,
        user_id: user.id,
        activity_type: "member_joined",
        entity_type: "user",
        entity_id: user.id,
        message: `${user.email} joined via domain match`,
        metadata: { auto_added: true },
      })

      return NextResponse.json({ status: "auto_added" })
    }

    // Get default role for the request
    let requestRoleId = roleId
    if (!requestRoleId) {
      const { data: editorRole } = await admin
        .from("roles")
        .select("id")
        .eq("business_id", businessId)
        .eq("name", "Editor")
        .single()
      requestRoleId = editorRole?.id
    }

    // Insert join request
    const { error: insertError } = await admin
      .from("workspace_join_requests")
      .insert({
        business_id: businessId,
        user_id: user.id,
        role_id: requestRoleId,
        message: message || null,
        status: "pending",
      })

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    // Record activity (using admin to bypass RLS since requester is not a member)
    await admin.from("workspace_activities").insert({
      business_id: businessId,
      user_id: user.id,
      activity_type: "member_join_request",
      entity_type: "user",
      entity_id: user.id,
      message: `${user.email} requested to join`,
      metadata: { message: message || null },
    })

    return NextResponse.json({ status: "pending" })
  } catch (err: any) {
    console.error("Join request error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// GET: Get current user's join requests (for waiting page)
export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data: requests, error } = await admin
      .from("workspace_join_requests")
      .select("id, status, created_at, business_id, businesses:business_id(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formatted = (requests || []).map((r: any) => ({
      id: r.id,
      businessName: r.businesses?.name || "Unknown",
      status: r.status,
      createdAt: r.created_at,
    }))

    return NextResponse.json({ requests: formatted })
  } catch (err: any) {
    console.error("Get join requests error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
