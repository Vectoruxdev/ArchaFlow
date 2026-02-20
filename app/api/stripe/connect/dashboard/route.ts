import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe/client"

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

    // Verify user is Owner
    const { data: role } = await admin
      .from("user_roles")
      .select("role:roles(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    const roleName = (role?.role as any)?.name
    if (!["Owner"].includes(roleName)) {
      return NextResponse.json({ error: "Only owners can access the Stripe dashboard" }, { status: 403 })
    }

    const { data: business } = await admin
      .from("businesses")
      .select("stripe_connect_account_id")
      .eq("id", businessId)
      .single()

    if (!business?.stripe_connect_account_id) {
      return NextResponse.json({ error: "No Stripe account connected" }, { status: 400 })
    }

    const stripe = getStripe()
    const loginLink = await stripe.accounts.createLoginLink(business.stripe_connect_account_id)

    return NextResponse.json({ url: loginLink.url })
  } catch (err: any) {
    console.error("[connect/dashboard] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
