"use client"

import { supabase } from "@/lib/supabase/client"

/**
 * Auth-aware fetch wrapper. On 401, refreshes the session and retries once.
 * Use for authenticated API calls so stale tokens after idle don't require logout.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const options: RequestInit = {
    ...init,
    credentials: init?.credentials ?? "include",
  }

  let response = await fetch(input, options)

  if (response.status === 401) {
    try {
      await supabase.auth.refreshSession()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("session-refreshed"))
      }
      response = await fetch(input, options)
    } catch {
      // return original 401 response
    }
  }

  return response
}
