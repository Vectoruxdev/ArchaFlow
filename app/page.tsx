"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase/client"

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // Don't block on auth - redirect quickly. Login page handles redirect for logged-in users.
    if (!isSupabaseConfigured()) {
      router.replace("/workflow")
      return
    }

    if (!authLoading) {
      // Auth ready: go to workflow if logged in, else login
      if (user) {
        router.replace("/workflow")
      } else {
        router.replace("/login")
      }
      return
    }

    // Auth still loading: after 1.5s max, go to login (avoids infinite loading)
    const timeout = setTimeout(() => {
      router.replace("/login")
    }, 1500)
    return () => clearTimeout(timeout)
  }, [authLoading, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 border-2 border-white dark:border-black rotate-45" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
