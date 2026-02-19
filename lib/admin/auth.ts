import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

interface VerifySuccess {
  userId: string
  email: string
}

interface VerifyError {
  error: string
  status: number
}

export async function verifySuperAdmin(): Promise<VerifySuccess | VerifyError> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Not authenticated", status: 401 }
  }

  const admin = getSupabaseAdmin()
  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.is_super_admin) {
    return { error: "Access denied", status: 403 }
  }

  return { userId: user.id, email: user.email! }
}

export function isVerifyError(
  result: VerifySuccess | VerifyError
): result is VerifyError {
  return "error" in result
}
