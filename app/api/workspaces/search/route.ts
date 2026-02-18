import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const query = request.nextUrl.searchParams.get("q")
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ workspaces: [] })
    }

    const admin = getSupabaseAdmin()

    // Get businesses the user is already a member of
    const { data: memberOf } = await admin
      .from("user_roles")
      .select("business_id")
      .eq("user_id", user.id)

    const memberBusinessIds = (memberOf || []).map((r: any) => r.business_id)

    // Search businesses by name
    const { data: businesses, error: searchError } = await admin
      .from("businesses")
      .select("id, name, allowed_email_domains")
      .ilike("name", `%${query.trim()}%`)
      .limit(10)

    if (searchError) {
      return NextResponse.json(
        { error: searchError.message },
        { status: 500 }
      )
    }

    // Extract user's email domain
    const userDomain = user.email?.split("@")[1]?.toLowerCase()

    // Filter out workspaces user is already in, and add recommendation flag
    const workspaces = (businesses || [])
      .filter((b: any) => !memberBusinessIds.includes(b.id))
      .map((b: any) => {
        const domains: string[] = Array.isArray(b.allowed_email_domains)
          ? b.allowed_email_domains
          : []
        const isRecommended =
          !!userDomain &&
          domains.some((d: string) => d.toLowerCase() === userDomain)

        return {
          id: b.id,
          name: b.name,
          isRecommended,
        }
      })

    // Sort recommended first
    workspaces.sort((a: any, b: any) => {
      if (a.isRecommended && !b.isRecommended) return -1
      if (!a.isRecommended && b.isRecommended) return 1
      return 0
    })

    return NextResponse.json({ workspaces })
  } catch (err: any) {
    console.error("Workspace search error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
