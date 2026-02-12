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

    const businessId = request.nextUrl.searchParams.get("businessId")
    const q = (request.nextUrl.searchParams.get("q") || "").trim()

    if (!businessId) {
      return NextResponse.json(
        { pages: [], projects: [], clients: [], leads: [], members: [] },
        { status: 200 }
      )
    }

    const admin = getSupabaseAdmin()

    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    const searchPattern = q.length >= 2 ? `%${q}%` : null

    const [projectsRes, clientsRes, leadsRes] = await Promise.all([
      searchPattern
        ? supabase
            .from("projects")
            .select("id, title, client_name")
            .eq("business_id", businessId)
            .or(`title.ilike.${searchPattern},client_name.ilike.${searchPattern}`)
            .is("archived_at", null)
            .limit(8)
        : Promise.resolve({ data: [], error: null }),
      searchPattern
        ? supabase
            .from("clients")
            .select("id, first_name, last_name, email")
            .eq("business_id", businessId)
            .is("archived_at", null)
            .or(
              `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`
            )
            .limit(8)
        : Promise.resolve({ data: [], error: null }),
      searchPattern
        ? supabase
            .from("leads")
            .select("id, first_name, last_name, email, company_name")
            .eq("business_id", businessId)
            .or(
              `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},company_name.ilike.${searchPattern}`
            )
            .limit(8)
        : Promise.resolve({ data: [], error: null }),
    ])

    const projects = (projectsRes.data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      clientName: p.client_name || null,
    }))

    const clients = (clientsRes.data || []).map((c: any) => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email || null,
    }))

    const leads = (leadsRes.data || []).map((l: any) => ({
      id: l.id,
      firstName: l.first_name,
      lastName: l.last_name,
      email: l.email || null,
      companyName: l.company_name || null,
    }))

    let members: { userId: string; firstName: string; lastName: string; email: string }[] = []

    if (searchPattern) {
      const { data: roleRows, error: rolesError } = await admin
        .from("user_roles")
        .select("id, user_id, role_id, roles:role_id(name)")
        .eq("business_id", businessId)

      if (!rolesError && roleRows && roleRows.length > 0) {
        const userIds = [...new Set((roleRows as any[]).map((r) => r.user_id))]
        const { data: profileRows } = await admin
          .from("user_profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", userIds)

        const profilesMap: Record<string, { first_name?: string; last_name?: string; full_name?: string }> = {}
        for (const p of profileRows || []) {
          profilesMap[p.id] = p
        }

        const emailById: Record<string, string> = {}
        await Promise.all(
          userIds.map(async (id) => {
            const { data } = await admin.auth.admin.getUserById(id)
            if (data?.user?.email) emailById[id] = data.user.email
          })
        )

        const allMembers = (roleRows as any[]).map((r) => {
          const profile = profilesMap[r.user_id] || {}
          let firstName = profile.first_name || ""
          let lastName = profile.last_name || ""
          if (!firstName && !lastName && profile.full_name) {
            const parts = profile.full_name.split(" ")
            firstName = parts[0] || ""
            lastName = parts.slice(1).join(" ") || ""
          }
          const fullName = `${firstName} ${lastName}`.trim().toLowerCase()
          const email = (emailById[r.user_id] || "").toLowerCase()
          const qLower = q.toLowerCase()
          const matches =
            fullName.includes(qLower) ||
            email.includes(qLower) ||
            (profile.first_name || "").toLowerCase().includes(qLower) ||
            (profile.last_name || "").toLowerCase().includes(qLower)

          return {
            userId: r.user_id,
            firstName,
            lastName,
            email: emailById[r.user_id] || "",
            matches,
          }
        })

        members = allMembers
          .filter((m) => m.matches)
          .slice(0, 8)
          .map(({ userId, firstName, lastName, email }) => ({
            userId,
            firstName,
            lastName,
            email,
          }))
      }
    }

    return NextResponse.json({
      projects,
      clients,
      leads,
      members,
    })
  } catch (err: any) {
    console.error("Search API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
