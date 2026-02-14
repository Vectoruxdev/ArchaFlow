import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connectionId = request.nextUrl.searchParams.get("connectionId")
    const businessId = request.nextUrl.searchParams.get("businessId")
    if (!connectionId || !businessId) {
      return NextResponse.json({ error: "Missing connectionId or businessId" }, { status: 400 })
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

    const { data: channels, error } = await supabaseAdmin
      .from("integration_channels")
      .select("*")
      .eq("connection_id", connectionId)
      .order("channel_name")

    if (error) throw error

    return NextResponse.json({ channels: channels || [] })
  } catch (error: any) {
    console.error("Channels GET error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { channelId, isSelected, businessId } = await request.json()
    if (!channelId || typeof isSelected !== "boolean" || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
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

    const { error } = await supabaseAdmin
      .from("integration_channels")
      .update({ is_selected: isSelected })
      .eq("id", channelId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Channels PATCH error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
