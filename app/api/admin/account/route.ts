import { NextRequest, NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function PATCH(request: NextRequest) {
  const auth = await verifySuperAdmin()
  if (isVerifyError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { email, password } = body

  if (!email && !password) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const updates: Record<string, string> = {}

  if (email) updates.email = email
  if (password) {
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }
    updates.password = password
  }

  const { error } = await admin.auth.admin.updateUserById(auth.userId, updates)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
