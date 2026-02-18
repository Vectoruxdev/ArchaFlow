"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Building2, RefreshCw } from "lucide-react"

interface JoinRequest {
  id: string
  businessName: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
}

export default function WaitingPage() {
  const router = useRouter()
  const { refreshWorkspaces, workspaces } = useAuth()
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)

  const loadRequests = async () => {
    try {
      const res = await authFetch("/api/join-request")
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])

        // If any request was accepted, refresh workspaces
        const hasAccepted = (data.requests || []).some(
          (r: JoinRequest) => r.status === "accepted"
        )
        if (hasAccepted) {
          await refreshWorkspaces()
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Poll for updates every 10 seconds
  useEffect(() => {
    loadRequests()
    const interval = setInterval(loadRequests, 10000)
    return () => clearInterval(interval)
  }, [])

  // If workspaces appeared (request accepted), redirect to workflow
  useEffect(() => {
    if (workspaces.length > 0) {
      router.push("/workflow")
    }
  }, [workspaces, router])

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "accepted":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Accepted</Badge>
      case "declined":
        return <Badge variant="destructive">Declined</Badge>
      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-2xl font-semibold">Waiting for approval</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your join request has been sent. The workspace owner will review it shortly.
      </p>

      {loading ? (
        <div className="py-8 text-center text-gray-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{req.businessName}</p>
                <p className="text-xs text-gray-500">
                  Requested {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
              {statusBadge(req.status)}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={loadRequests}
          className="flex-1"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/onboarding")}
          className="flex-1"
        >
          Create workspace instead
        </Button>
      </div>
    </div>
  )
}
