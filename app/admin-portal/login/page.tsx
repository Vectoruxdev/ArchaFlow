"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Verify super admin status
      const res = await fetch("/api/admin/auth")
      if (!res.ok) {
        // Not a super admin — sign them out
        await supabase.auth.signOut()
        setError("Access denied. This portal is restricted to super admins.")
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--af-bg-canvas] dark:bg-warm-950">
      <div className="w-full max-w-sm">
        <div className="bg-[--af-bg-surface] dark:bg-warm-900 border border-[--af-border-default] rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-warm-900 dark:bg-[--af-bg-surface] flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-white dark:text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold">ArchaFlow Admin</h1>
              <p className="text-sm text-[--af-text-muted]">
                Super Admin Portal
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[--af-danger-bg] border border-[--af-danger-border] rounded-lg p-3">
                <p className="text-sm text-[--af-danger-text]">
                  {error}
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@archaflow.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
