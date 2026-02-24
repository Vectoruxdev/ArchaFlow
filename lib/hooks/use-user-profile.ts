import useSWR from "swr"
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"

async function fetchAvatarUrl(userId: string): Promise<string> {
  if (!isSupabaseConfigured()) return ""
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single()
    return data?.avatar_url || ""
  } catch {
    return ""
  }
}

export function useAvatarUrl(userId: string | undefined) {
  return useSWR(
    userId ? ["avatar", userId] : null,
    ([, id]) => fetchAvatarUrl(id),
  )
}
