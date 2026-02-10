"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ActivityFormData {
  activityType: string
  subject: string
  description: string
  callDuration: string
  callOutcome: string
}

const activityTypeOptions = [
  { value: "call", label: "Log Call" },
  { value: "email", label: "Log Email" },
  { value: "meeting", label: "Log Meeting" },
  { value: "note", label: "Add Note" },
]

const callOutcomeOptions = [
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Voicemail" },
  { value: "no_answer", label: "No Answer" },
  { value: "busy", label: "Busy" },
]

interface LogActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: string
  onSave: (data: ActivityFormData) => Promise<void> | void
  leadName?: string
}

export function LogActivityModal({
  open,
  onOpenChange,
  defaultType = "call",
  onSave,
  leadName,
}: LogActivityModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    activityType: defaultType,
    subject: "",
    description: "",
    callDuration: "",
    callOutcome: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormData({
        activityType: defaultType,
        subject: "",
        description: "",
        callDuration: "",
        callOutcome: "",
      })
      setSaveError(null)
    }
  }, [open, defaultType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error: any) {
      setSaveError(error.message || "Failed to log activity")
    } finally {
      setIsSaving(false)
    }
  }

  const update = (field: keyof ActivityFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isCall = formData.activityType === "call"
  const typeLabel = activityTypeOptions.find((o) => o.value === formData.activityType)?.label || "Activity"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{typeLabel}</DialogTitle>
          <DialogDescription>
            {leadName ? `Log activity for ${leadName}` : "Log a new activity for this lead."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Type</label>
            <Select value={formData.activityType} onValueChange={(v) => update("activityType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {activityTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              placeholder={isCall ? "Follow-up call about proposal" : "Subject..."}
              value={formData.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
          </div>

          {isCall && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Call Duration (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="15"
                  value={formData.callDuration}
                  onChange={(e) => update("callDuration", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Call Outcome</label>
                <Select value={formData.callOutcome} onValueChange={(v) => update("callOutcome", v)}>
                  <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                  <SelectContent>
                    {callOutcomeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isCall ? "Call Notes" : formData.activityType === "note" ? "Note" : "Description"}
            </label>
            <Textarea
              placeholder={
                isCall
                  ? "What was discussed?"
                  : formData.activityType === "note"
                    ? "Enter your note..."
                    : "Describe the activity..."
              }
              className="min-h-[120px] resize-none"
              value={formData.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <DialogFooter>
            {saveError && <p className="text-sm text-red-600 flex-1">{saveError}</p>}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : `Save ${typeLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
