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
import { PLAN_CONFIGS, type PlanTier } from "@/lib/stripe/config"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ChangeTierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  currentTier: PlanTier
  isComped: boolean
  hasSubscription: boolean
  onSuccess: () => void
}

export function ChangeTierModal({
  open,
  onOpenChange,
  businessId,
  currentTier,
  isComped,
  hasSubscription,
  onSuccess,
}: ChangeTierModalProps) {
  const tiers: PlanTier[] = ["free", "pro", "enterprise"]
  const availableTiers = tiers.filter((t) => t !== currentTier)

  const [newTier, setNewTier] = useState<PlanTier>(availableTiers[0] || "pro")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const newConfig = PLAN_CONFIGS[newTier]
  const isDowngradeToFree = newTier === "free"
  const needsSubscription = !isDowngradeToFree && !hasSubscription

  async function handleChange() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/billing/change-tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newTier,
          reason: reason || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || "Tier changed")
      onSuccess()
      onOpenChange(false)
      setReason("")
    } catch (err: any) {
      toast.error(err.message || "Failed to change tier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Plan Tier</DialogTitle>
          <DialogDescription>
            Change this business&apos;s plan tier. Proration will be applied for active subscriptions.
          </DialogDescription>
        </DialogHeader>

        {isComped && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[--af-danger-bg] border border-[--af-danger-border]">
            <AlertCircle className="w-4 h-4 text-[--af-danger-text] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[--af-danger-text]">
              This business is comped. Remove the comp before changing the tier.
            </p>
          </div>
        )}

        {needsSubscription && !isComped && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-400">
              No active subscription. To grant a paid tier without payment, use Comp Plan instead.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">New Tier</label>
            <Select value={newTier} onValueChange={(v) => setNewTier(v as PlanTier)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTiers.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PLAN_CONFIGS[t].name} — ${PLAN_CONFIGS[t].basePrice}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-[--af-bg-surface-alt] border border-[--af-border-default] text-sm space-y-1">
            <p>
              <span className="text-[--af-text-muted]">Change:</span>{" "}
              {PLAN_CONFIGS[currentTier].name} → <span className="font-medium">{newConfig.name}</span>
            </p>
            <p><span className="text-[--af-text-muted]">Price:</span> ${newConfig.basePrice}/mo</p>
            <p><span className="text-[--af-text-muted]">Seats:</span> {newConfig.includedSeats} included</p>
            {isDowngradeToFree && hasSubscription && (
              <p className="text-orange-600 dark:text-orange-400">
                Subscription will be canceled at end of billing period
              </p>
            )}
            {!isDowngradeToFree && hasSubscription && (
              <p className="text-[--af-info-text]">
                Proration will be applied
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason (optional)</label>
            <Textarea
              placeholder="Why is the tier being changed?"
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
          <Button
            onClick={handleChange}
            disabled={loading || isComped || needsSubscription}
            variant={isDowngradeToFree ? "destructive" : "default"}
          >
            {loading ? "Changing..." : isDowngradeToFree ? "Downgrade to Free" : "Change Tier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
