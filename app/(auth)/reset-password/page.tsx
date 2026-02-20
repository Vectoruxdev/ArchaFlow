"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState(false)

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidToken(true)
      } else {
        setError("Invalid or expired reset link. Please request a new one.")
      }
    }).catch(() => setError("Unable to verify reset link. Please check your connection and try again."))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error
      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!validToken && error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Invalid Link</h1>
        <p className="text-[--af-text-secondary] mb-6">{error}</p>

        <Link href="/forgot-password">
          <Button className="w-full">Request new reset link</Button>
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-[--af-success-bg] rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[--af-success-text]" />
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Password updated!</h1>
        <p className="text-[--af-text-secondary] mb-6">
          Your password has been successfully reset. Redirecting to sign in...
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Set new password</h1>
        <p className="text-[--af-text-secondary]">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-[--af-danger-bg] border border-[--af-danger-border] rounded-lg p-3">
            <p className="text-sm text-[--af-danger-text]">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            New Password
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
          <p className="text-xs text-[--af-text-muted] mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Resetting password..." : "Reset password"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-[--af-text-secondary] hover:text-foreground dark:hover:text-white"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
