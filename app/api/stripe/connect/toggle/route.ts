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

    const { businessId } = await request.json()
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify user is Owner or Admin
    const { data: role } = await admin
      .from("user_roles")
      .select("role:roles(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    const roleName = (role?.role as any)?.name
    if (!["Owner", "Admin"].includes(roleName)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: business } = await admin
      .from("businesses")
      .select("stripe_connect_onboarding_complete, online_payments_enabled")
      .eq("id", businessId)
      .single()

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    if (!business.stripe_connect_onboarding_complete) {
      return NextResponse.json(
        { error: "Complete Stripe Connect onboarding first" },
        { status: 400 }
      )
    }

    const newValue = !business.online_payments_enabled

    await admin
      .from("businesses")
      .update({ online_payments_enabled: newValue })
      .eq("id", businessId)

    return NextResponse.json({ enabled: newValue })
  } catch (err: any) {
    console.error("[connect/toggle] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
