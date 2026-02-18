"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowLeft, Building2, Send } from "lucide-react"

interface WorkspaceResult {
  id: string
  name: string
  isRecommended: boolean
}

export default function JoinWorkspacePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<WorkspaceResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceResult | null>(null)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Search workspaces with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await authFetch(`/api/workspaces/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.workspaces || [])
        }
      } catch {
        // ignore search errors
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSubmitRequest = async () => {
    if (!selectedWorkspace) return
    setError("")
    setSubmitting(true)

    try {
      const res = await authFetch("/api/join-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedWorkspace.id,
          message: message.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to send join request")
        return
      }

      if (data.status === "auto_added") {
        // User was auto-added, go straight to workflow
        router.push("/workflow")
      } else {
        // Request is pending, go to waiting page
        router.push("/onboarding/waiting")
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  // If a workspace is selected, show the request form
  if (selectedWorkspace) {
    return (
      <div>
        <button
          onClick={() => setSelectedWorkspace(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </button>

        <h1 className="text-2xl font-semibold mb-2 text-card-foreground">Request to join</h1>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{selectedWorkspace.name}</span>
          {selectedWorkspace.isRecommended && (
            <Badge variant="secondary" className="text-xs">Recommended</Badge>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message <span className="text-gray-500">(optional)</span>
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'd like to join your workspace..."
              rows={3}
              disabled={submitting}
            />
          </div>

          <Button
            onClick={handleSubmitRequest}
            disabled={submitting}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Sending..." : "Send join request"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => router.push("/onboarding")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <h1 className="text-2xl font-semibold mb-2 text-card-foreground">Join a workspace</h1>
      <p className="text-muted-foreground mb-6">
        Search for the workspace you&apos;d like to join.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workspaces by name..."
          className="pl-10"
        />
      </div>

      {searching && (
        <p className="text-sm text-gray-500 py-2">Searching...</p>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No workspaces found</p>
          <p className="text-[13px] text-muted-foreground mt-2">
            Try a different search term, or create your own workspace.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          {results.map((ws, idx) => (
            <button
              key={ws.id}
              onClick={() => setSelectedWorkspace(ws)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left ${
                idx > 0 ? "border-t border-border" : ""
              }`}
            >
              <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm flex-1">{ws.name}</span>
              {ws.isRecommended && (
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
