"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const iconOptions = ["🏢", "🏗️", "📐", "🏛️", "🏘️", "🌆", "🏙️", "🏠"]

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const { createWorkspace, switchWorkspace } = useAuth()
  const [name, setName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("🏢")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Workspace name is required")
      return
    }

    setLoading(true)

    try {
      const workspace = await createWorkspace(name.trim(), selectedIcon)
      
      // Switch to the new workspace
      switchWorkspace(workspace.id)
      
      // Close dialog
      onOpenChange(false)
      
      // Reset form
      setName("")
      setSelectedIcon("🏢")
    } catch (err: any) {
      setError(err.message || "Failed to create workspace")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-[--af-danger-bg] border border-[--af-danger-border] rounded-lg p-3">
              <p className="text-sm text-[--af-danger-text]">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Workspace Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Architecture"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Choose an Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`text-2xl p-2 rounded-card border-2 transition-all ${
                    selectedIcon === icon
                      ? "border-foreground dark:border-white bg-[--af-bg-surface-alt] dark:bg-warm-800"
                      : "border-[--af-border-default] dark:border-warm-700 hover:border-[--af-border-default] dark:hover:border-warm-600"
                  }`}
                  disabled={loading}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
