import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = params

    const { data: session, error } = await supabaseAdmin
      .from("message_scan_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Verify user is a member of the session's workspace
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", session.business_id)
      .single()

    if (!role) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    return NextResponse.json({ session })
  } catch (error: any) {
    console.error("Scan session GET error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
