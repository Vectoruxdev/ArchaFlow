"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-[--af-success-bg] rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[--af-success-text]" />
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Check your email</h1>
        <p className="text-[--af-text-secondary] mb-6">
          We've sent a password reset link to <strong>{email}</strong>
        </p>

        <p className="text-sm text-[--af-text-secondary] mb-6">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            onClick={() => {
              setSuccess(false)
              setEmail("")
            }}
            className="text-foreground hover:underline"
          >
            try again
          </button>
        </p>

        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight mb-2">Reset your password</h1>
        <p className="text-[--af-text-secondary]">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-[--af-danger-bg] border border-[--af-danger-border] rounded-lg p-3">
            <p className="text-sm text-[--af-danger-text]">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
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
