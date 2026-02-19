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
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Verify caller is workspace owner
    const { data: callerRole } = await admin
      .from("user_roles")
      .select("role_id, roles:role_id(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    const roleName = (callerRole as any)?.roles?.name
    if (roleName !== "Owner") {
      return NextResponse.json(
        { error: "Only workspace owners can manage billing" },
        { status: 403 }
      )
    }

    // Get Stripe customer ID
    const { data: business } = await admin
      .from("businesses")
      .select("stripe_customer_id")
      .eq("id", businessId)
      .single()

    if (!business?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    const session = await stripe.billingPortal.sessions.create({
      customer: business.stripe_customer_id,
      return_url: `${siteUrl}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("[portal] Error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
