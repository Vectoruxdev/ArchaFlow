"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export interface WorkspaceMember {
  userId: string
  userRoleId: string
  email: string
  firstName: string
  lastName: string
  roleName: string
  type: "member"
}

export interface AssignTeamModalProps {
  projectId: string
  businessId: string
  currentPrimaryOwnerId: string | null
  currentSecondaryOwnerId: string | null
  onSave: () => void
  onClose: () => void
  open: boolean
}

const NONE_VALUE = "__none__"

export function AssignTeamModal({
  projectId,
  businessId,
  currentPrimaryOwnerId,
  currentSecondaryOwnerId,
  onSave,
  onClose,
  open,
}: AssignTeamModalProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [primaryOwnerId, setPrimaryOwnerId] = useState<string>(currentPrimaryOwnerId ?? "")
  const [secondaryOwnerId, setSecondaryOwnerId] = useState<string>(
    currentSecondaryOwnerId ? currentSecondaryOwnerId : NONE_VALUE
  )

  useEffect(() => {
    if (!open || !businessId) return
    setPrimaryOwnerId(currentPrimaryOwnerId ?? "")
    setSecondaryOwnerId(currentSecondaryOwnerId ? currentSecondaryOwnerId : NONE_VALUE)
    setError(null)
    let cancelled = false
    setLoadingMembers(true)
    fetch(`/api/teams/members?businessId=${encodeURIComponent(businessId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load team members")
        return res.json()
      })
      .then((data: WorkspaceMember[]) => {
        if (!cancelled) setMembers(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load members")
      })
      .finally(() => {
        if (!cancelled) setLoadingMembers(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, businessId, currentPrimaryOwnerId, currentSecondaryOwnerId])

  const displayName = (m: WorkspaceMember) => {
    const name = [m.firstName, m.lastName].filter(Boolean).join(" ").trim()
    return name || m.email || m.userId
  }

  const handleSave = async () => {
    if (!primaryOwnerId.trim()) {
      setError("Please select a Primary owner.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const secondary = secondaryOwnerId === NONE_VALUE || !secondaryOwnerId ? null : secondaryOwnerId
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          primary_owner_id: primaryOwnerId,
          secondary_owner_id: secondary,
        })
        .eq("id", projectId)
        .eq("business_id", businessId)

      if (updateError) throw updateError
      onSave()
      onClose()
    } catch (err: any) {
      const msg = err?.message ?? "Failed to save"
      if (typeof msg === "string" && (msg.includes("primary_owner_id") || msg.includes("does not exist"))) {
        setError(
          "Database migration required. In Supabase Dashboard go to SQL Editor, open supabase-add-project-owners.sql from your project, and run it. Then try again."
        )
      } else {
        setError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const canSave = !!primaryOwnerId.trim() && !saving

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Team Members</DialogTitle>
          <DialogDescription>
            Set the Primary and optional Secondary owner for this project. Only workspace members are listed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          {loadingMembers ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading team members…
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary owner (required)</label>
                <Select
                  value={primaryOwnerId || undefined}
                  onValueChange={(v) => setPrimaryOwnerId(v ?? "")}
                  disabled={members.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary owner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {displayName(m)}
                        {m.email ? ` (${m.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secondary owner (optional)</label>
                <Select
                  value={secondaryOwnerId}
                  onValueChange={(v) => setSecondaryOwnerId(v ?? NONE_VALUE)}
                  disabled={members.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {displayName(m)}
                        {m.email ? ` (${m.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
