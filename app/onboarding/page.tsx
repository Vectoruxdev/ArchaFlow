"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Users } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, createWorkspace } = useAuth()
  const [creating, setCreating] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!workspaceName.trim()) {
      setError("Workspace name is required")
      return
    }
    setError("")
    setCreating(true)
    try {
      await createWorkspace(workspaceName.trim(), "🏢")
      router.push("/workflow")
    } catch (err: any) {
      setError(err.message || "Failed to create workspace")
    } finally {
      setCreating(false)
    }
  }

  if (showCreateForm) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-2">Create your workspace</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Give your workspace a name to get started.
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium mb-2">
              Workspace Name
            </label>
            <Input
              id="workspaceName"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Acme Architecture"
              disabled={creating}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              disabled={creating}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1"
            >
              {creating ? "Creating..." : "Create workspace"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Welcome to ArchaFlow</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        How would you like to get started?
      </p>

      <div className="space-y-3">
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <p className="font-medium">Create a workspace</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Start fresh with your own workspace for your team.
            </p>
          </div>
        </button>

        <button
          onClick={() => router.push("/onboarding/join")}
          className="w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </div>
          <div>
            <p className="font-medium">Join an existing workspace</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Request to join a workspace that&apos;s already set up.
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
