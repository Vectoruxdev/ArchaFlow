import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { AdminActivityEntry } from "@/lib/admin/types"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (isVerifyError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = getSupabaseAdmin()
  const businessId = params.id

  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "25")
  const offset = (page - 1) * limit

  const { data: activities, count, error } = await admin
    .from("workspace_activities")
    .select("id, activity_type, description, performed_by, created_at", {
      count: "exact",
    })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get performer emails from auth.users
  const performerIds = [...new Set((activities || [])
    .map((a: any) => a.performed_by)
    .filter(Boolean))]
  let performerEmails: Record<string, string> = {}
  for (const pid of performerIds) {
    const { data: { user: pUser } } = await admin.auth.admin.getUserById(pid)
    if (pUser?.email) {
      performerEmails[pid] = pUser.email
    }
  }

  const entries: AdminActivityEntry[] = (activities || []).map((a: any) => ({
    id: a.id,
    activityType: a.activity_type,
    description: a.description,
    performedBy: a.performed_by,
    performedByEmail: performerEmails[a.performed_by] || null,
    createdAt: a.created_at,
  }))

  return NextResponse.json({
    activities: entries,
    total: count || 0,
    page,
    pageSize: limit,
  })
}
