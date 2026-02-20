"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ChangeOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  invoiceNumber: string
  onCreated?: () => void
}

export function ChangeOrderModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  onCreated,
}: ChangeOrderModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount)) {
      toast.error("Enter a valid amount")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/change-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          amount: parsedAmount,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to create change order")
      }

      toast.success("Change order created")
      onOpenChange(false)
      setTitle("")
      setDescription("")
      setAmount("")
      onCreated?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Change Order — {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Create a change order to adjust the invoice total. Positive amounts add to the total, negative amounts are credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Additional design revisions"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full border border-[--af-border-default] rounded-lg px-3 py-2 text-sm bg-[--af-bg-surface] dark:bg-warm-900 min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the scope change"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount ($)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Positive = addition, negative = credit"
              step="0.01"
              required
            />
            <p className="text-xs text-[--af-text-muted]">
              Use positive for additions, negative for credits/deductions
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Change Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
