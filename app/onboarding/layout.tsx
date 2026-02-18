"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, workspaces, workspacesLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || !workspacesLoaded) return
    // Not logged in — go to login
    if (!user) {
      router.push("/login")
      return
    }
    // Already has workspaces — skip onboarding
    if (workspaces.length > 0) {
      router.push("/workflow")
    }
  }, [loading, workspacesLoaded, user, workspaces, router])

  if (loading || !workspacesLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary-foreground rotate-45" />
            </div>
            <span className="font-semibold text-2xl text-foreground">ArchaFlow</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          &copy; 2026 ArchaFlow. All rights reserved.
        </p>
      </div>
    </div>
  )
}
