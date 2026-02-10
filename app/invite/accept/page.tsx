"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, LogIn } from "lucide-react"

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, session, loading: authLoading } = useAuth()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "accepting" | "success" | "error" | "needs_auth">("loading")
  const [message, setMessage] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [detailsLoading, setDetailsLoading] = useState(false)

  // When not authenticated, fetch invite details (workspace name + email) for the prompt
  useEffect(() => {
    if (!token || status !== "needs_auth") return

    let cancelled = false
    setDetailsLoading(true)

    fetch(`/api/invite/details?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setStatus("error")
          setMessage("Invitation not found or expired.")
          setDetailsLoading(false)
          return
        }
        return res.json()
      })
      .then((data) => {
        if (cancelled || !data) return
        setWorkspaceName(data.workspaceName || "this workspace")
        setInviteEmail(data.email || "")
        setMessage("")
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load invitation details.")
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, status])

  useEffect(() => {
    if (authLoading) return

    if (!token) {
      setStatus("error")
      setMessage("No invitation token provided.")
      return
    }

    if (!user || !session) {
      setStatus("needs_auth")
      return
    }

    // User is authenticated, accept the invitation
    acceptInvitation()
  }, [token, user, session, authLoading])

  const acceptInvitation = async () => {
    if (!token) return
    setStatus("accepting")

    try {
      // Use the details API for lookup (bypasses RLS so invitee can always resolve by token)
      const detailsRes = await fetch(`/api/invite/details?token=${encodeURIComponent(token)}`)
      let detailsData: any = null
      try {
        detailsData = await detailsRes.json()
      } catch {
        detailsData = {}
      }

      if (!detailsRes.ok) {
        setStatus("error")
        const err =
          detailsData?.error ||
          (detailsData?.status === "expired" ? "Invitation has expired." : "Invitation not found or expired.")
        setMessage(err)
        return
      }

      setWorkspaceName(detailsData.workspaceName || "the workspace")

      if (detailsData.status && detailsData.status !== "pending") {
        setStatus("success")
        setMessage(
          detailsData.status === "accepted"
            ? "You've already accepted this invitation."
            : "This invitation is no longer valid."
        )
        if (detailsData.businessId) {
          localStorage.setItem("currentWorkspaceId", detailsData.businessId)
        }
        setTimeout(() => router.push("/dashboard"), 2000)
        return
      }

      const { data, error } = await supabase.rpc("accept_workspace_invitation", {
        invitation_token: token,
      })

      if (error) {
        setStatus("error")
        setMessage(error.message || "Failed to accept invitation.")
        return
      }

      const result = data as any

      if (result.status === "already_member") {
        setStatus("success")
        setMessage(`You're already a member of ${workspaceName || "this workspace"}.`)
      } else {
        setStatus("success")
        setMessage(`You've joined ${workspaceName || "the workspace"} successfully!`)
      }

      setTimeout(() => {
        if (result.business_id) {
          localStorage.setItem("currentWorkspaceId", result.business_id)
        }
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "An unexpected error occurred.")
    }
  }

  const goToLogin = () => {
    // Preserve the token in the redirect so after login the user comes back
    const returnUrl = `/invite/accept?token=${token}`
    router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
  }

  const goToSignup = () => {
    const returnUrl = `/invite/accept?token=${token}`
    const params = new URLSearchParams({ redirect: returnUrl })
    if (inviteEmail) params.set("email", inviteEmail)
    router.push(`/signup?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
        {status === "loading" || status === "accepting" ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin mx-auto" />
            <h1 className="text-xl font-semibold">
              {status === "loading" ? "Loading..." : "Accepting invitation..."}
            </h1>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </div>
        ) : status === "needs_auth" ? (
          <div className="space-y-6">
            <LogIn className="w-12 h-12 text-gray-400 mx-auto" />
            {detailsLoading ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                <p className="text-sm text-gray-500">Loading invitation...</p>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-xl font-semibold">
                    Join {workspaceName || "this workspace"}?
                  </h1>
                  <p className="text-sm text-gray-500 mt-2">
                    Sign in or create an account with the invited email to accept.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button className="w-full" onClick={goToLogin}>
                    Sign In
                  </Button>
                  <Button className="w-full" variant="outline" onClick={goToSignup}>
                    Create Account
                  </Button>
                </div>
              </>
            )}
            {!detailsLoading && message && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>
            )}
          </div>
        ) : status === "success" ? (
          <div className="space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold">Invitation Accepted!</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <p className="text-xs text-gray-400">Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
