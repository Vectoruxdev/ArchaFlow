import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getSlackOAuthURL } from "@/lib/integrations/slack"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = request.nextUrl.searchParams.get("businessId")
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
    }

    // Verify membership
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!role) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    // Create state with business ID and nonce
    const nonce = crypto.randomUUID()
    const state = Buffer.from(
      JSON.stringify({ businessId, userId: user.id, nonce })
    ).toString("base64url")

    // Store nonce in HttpOnly cookie for CSRF protection
    const cookieStore = cookies()
    cookieStore.set("integration_oauth_state", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    })

    const url = getSlackOAuthURL(state)
    return NextResponse.redirect(url)
  } catch (error: any) {
    console.error("Slack authorize error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
