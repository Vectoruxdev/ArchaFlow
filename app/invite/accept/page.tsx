"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { recordActivity } from "@/lib/activity"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, LogIn } from "lucide-react"

function AcceptInviteContent() {
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
        setTimeout(() => router.push("/workflow"), 2000)
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
        if (result.business_id && user) {
          const displayName = user.user_metadata?.full_name || user.email || "A new member"
          recordActivity({
            businessId: result.business_id,
            userId: user.id,
            activityType: "member_joined",
            entityType: "user_role",
            entityId: result.role_id,
            message: `${displayName} joined the workspace`,
          }).catch(() => {})
        }
      }

      setTimeout(() => {
        if (result.business_id) {
          localStorage.setItem("currentWorkspaceId", result.business_id)
        }
        router.push("/workflow")
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
    <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[--af-bg-surface] border border-[--af-border-default] rounded-xl p-8 text-center">
        {status === "loading" || status === "accepting" ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-[--af-text-muted] animate-spin mx-auto" />
            <h1 className="text-xl font-display font-bold tracking-tight">
              {status === "loading" ? "Loading..." : "Accepting invitation..."}
            </h1>
            <p className="text-sm text-[--af-text-muted]">Please wait a moment.</p>
          </div>
        ) : status === "needs_auth" ? (
          <div className="space-y-6">
            <LogIn className="w-12 h-12 text-[--af-text-muted] mx-auto" />
            {detailsLoading ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 text-[--af-text-muted] animate-spin mx-auto" />
                <p className="text-sm text-[--af-text-muted]">Loading invitation...</p>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-xl font-display font-bold tracking-tight">
                    Join {workspaceName || "this workspace"}?
                  </h1>
                  <p className="text-sm text-[--af-text-muted] mt-2">
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
            <CheckCircle2 className="w-12 h-12 text-[--af-success-text] mx-auto" />
            <h1 className="text-xl font-display font-bold tracking-tight">Invitation Accepted!</h1>
            <p className="text-sm text-[--af-text-muted]">{message}</p>
            <p className="text-xs text-[--af-text-muted]">Redirecting to Workflow...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <XCircle className="w-12 h-12 text-[--af-danger-text] mx-auto" />
            <h1 className="text-xl font-display font-bold tracking-tight">Something went wrong</h1>
            <p className="text-sm text-[--af-text-muted]">{message}</p>
            <Button variant="outline" onClick={() => router.push("/workflow")}>
              Go to Workflow
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-900 flex items-center justify-center p-4">
          <Loader2 className="w-10 h-10 text-[--af-text-muted] animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
