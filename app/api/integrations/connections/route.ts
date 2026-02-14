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
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const { data: connections, error } = await supabaseAdmin
      .from("integration_connections")
      .select("id, provider, provider_metadata, connected_by, created_at")
      .eq("business_id", businessId)

    if (error) throw error

    return NextResponse.json({ connections: connections || [] })
  } catch (error: any) {
    console.error("Connections GET error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { connectionId, businessId } = await request.json()
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
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from("integration_connections")
      .delete()
      .eq("id", connectionId)
      .eq("business_id", businessId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Connections DELETE error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
