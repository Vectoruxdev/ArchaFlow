"use client"

import { useState } from "react"
import { useAdminAuth } from "@/lib/admin/admin-auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AdminSettingsPage() {
  const { user } = useAdminAuth()

  const [email, setEmail] = useState(user?.email || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!email || email === user?.email) {
      setError("Enter a new email address")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setMessage("Email updated successfully")
      }
    } catch {
      setError("Failed to update email")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!password) {
      setError("Enter a new password")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setMessage("Password updated successfully")
        setPassword("")
        setConfirmPassword("")
      }
    } catch {
      setError("Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>

      {message && (
        <div className="bg-[--af-success-bg] border border-[--af-success-border] rounded-lg p-3">
          <p className="text-sm text-[--af-success-text]">{message}</p>
        </div>
      )}
      {error && (
        <div className="bg-[--af-danger-bg] border border-[--af-danger-border] rounded-lg p-3">
          <p className="text-sm text-[--af-danger-text]">{error}</p>
        </div>
      )}

      {/* Update Email */}
      <div className="bg-[--af-bg-surface] dark:bg-warm-900 border border-[--af-border-default] rounded-lg p-6">
        <h2 className="text-base font-semibold mb-4">Update Email</h2>
        <form onSubmit={handleUpdateEmail} className="space-y-4">
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
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Email"}
          </Button>
        </form>
      </div>

      {/* Update Password */}
      <div className="bg-[--af-bg-surface] dark:bg-warm-900 border border-[--af-border-default] rounded-lg p-6">
        <h2 className="text-base font-semibold mb-4">Update Password</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
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
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  )
}
