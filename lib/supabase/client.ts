"use client"

import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Check if values are actually set (not just the placeholders)
const IS_CONFIGURED = supabaseUrl !== "https://placeholder.supabase.co" && 
                      supabaseAnonKey !== "placeholder-key"

// Wrapper around navigator.locks that replicates Supabase's internal behavior
// (from @supabase/auth-js/dist/module/lib/locks.js) but catches AbortError
// instead of letting it crash the Next.js dev error overlay.
//
// Critical behaviors matched from Supabase source:
//   acquireTimeout === 0  →  { ifAvailable: true }, return null if lock not acquired
//   acquireTimeout  > 0   →  { signal } with AbortController timeout
//
// The key difference: on AbortError (stale lock from hot-reload), we fall back
// to running fn() directly so auth initialization isn't permanently blocked.
async function robustLock(name: string, acquireTimeout: number, fn: () => Promise<any>) {
  if (typeof navigator === "undefined" || !navigator?.locks?.request) {
    // SSR or no navigator.locks available — run directly
    return await fn()
  }

  if (acquireTimeout === 0) {
    // Non-blocking attempt: try to acquire lock immediately, return null if busy.
    // This matches Supabase's behavior exactly — do NOT run fn() without the lock.
    return await navigator.locks.request(
      name,
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        if (!lock) {
          return null
        }
        return await fn()
      }
    )
  }

  // Blocking attempt with timeout: use AbortController to prevent deadlocks
  const abortController = new AbortController()
  const timer = setTimeout(() => abortController.abort(), acquireTimeout)

  try {
    return await navigator.locks.request(
      name,
      { mode: "exclusive", signal: abortController.signal },
      async (lock) => {
        clearTimeout(timer)
        return await fn()
      }
    )
  } catch (err: any) {
    clearTimeout(timer)
    if (err.name === "AbortError") {
      // Timeout expired (stale lock from hot-reload) — run fn() without lock
      // so auth initialization can still complete
      return await fn()
    }
    throw err
  }
}

// Create browser client that properly handles cookies and session
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: robustLock,
  },
})

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return IS_CONFIGURED
}
