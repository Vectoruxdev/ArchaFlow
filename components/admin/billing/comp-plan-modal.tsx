"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PLAN_CONFIGS } from "@/lib/stripe/config"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface CompPlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  hasActiveSubscription: boolean
  onSuccess: () => void
}

export function CompPlanModal({
  open,
  onOpenChange,
  businessId,
  hasActiveSubscription,
  onSuccess,
}: CompPlanModalProps) {
  const [tier, setTier] = useState<"pro" | "enterprise">("pro")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const config = PLAN_CONFIGS[tier]

  async function handleApply() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/billing/comp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          tier,
          reason: reason || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || "Plan comped")
      onSuccess()
      onOpenChange(false)
      setReason("")
    } catch (err: any) {
      toast.error(err.message || "Failed to comp plan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comp Plan</DialogTitle>
          <DialogDescription>
            Grant Pro or Enterprise features without a Stripe subscription.
          </DialogDescription>
        </DialogHeader>

        {hasActiveSubscription && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-400">
              This business has an active Stripe subscription. It will be canceled before applying the comp.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Tier</label>
            <Select value={tier} onValueChange={(v) => setTier(v as "pro" | "enterprise")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-[--af-bg-surface-alt] border border-[--af-border-default] text-sm space-y-1">
            <p><span className="text-[--af-text-muted]">Plan:</span> <span className="font-medium">{config.name}</span></p>
            <p><span className="text-[--af-text-muted]">Seats:</span> {config.includedSeats} included</p>
            <p><span className="text-[--af-text-muted]">AI Credits:</span> {config.aiCredits}</p>
            <p><span className="text-[--af-text-muted]">Cost:</span> <span className="text-[--af-success-text] font-medium">$0 (comped)</span></p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason (optional)</label>
            <Textarea
              placeholder="e.g. Beta tester, partner, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading}>
            {loading ? "Applying..." : "Comp Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
