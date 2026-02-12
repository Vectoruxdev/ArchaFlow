"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")
  const emailParam = searchParams.get("email")
  const isInviteFlow = redirect?.includes("/invite/accept") ?? false

  const { signUp } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (emailParam) setEmail(emailParam)
  }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (!acceptedTerms) {
      setError("You must accept the terms and conditions")
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, fullName, workspaceName || `${fullName}'s Workspace`)
      router.push(redirect ?? "/workflow")
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get started with ArchaFlow today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={loading}
          />
        </div>

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

        <div>
          <label htmlFor="workspaceName" className="block text-sm font-medium mb-2">
            Workspace Name <span className="text-gray-500">(Optional)</span>
          </label>
          <Input
            id="workspaceName"
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder={isInviteFlow ? "" : "Acme Architecture"}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {isInviteFlow
              ? "You're joining an existing workspace — leave blank."
              : `Leave blank to use "${fullName}'s Workspace"`}
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
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
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm Password
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

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            disabled={loading}
          />
          <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
            I agree to the{" "}
            <Link href="/terms" className="text-black dark:text-white hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-black dark:text-white hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-black dark:text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]">Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}
