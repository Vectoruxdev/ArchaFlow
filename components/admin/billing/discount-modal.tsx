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
import { Input } from "@/components/ui/input"
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

interface DiscountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  planTier: PlanTier
  isFoundingMember: boolean
  onSuccess: () => void
}

export function DiscountModal({
  open,
  onOpenChange,
  businessId,
  planTier,
  isFoundingMember,
  onSuccess,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [duration, setDuration] = useState<"forever" | "once" | "repeating">("forever")
  const [durationInMonths, setDurationInMonths] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const config = PLAN_CONFIGS[planTier]
  const value = parseFloat(discountValue) || 0

  // Compute effective price preview
  let effectivePrice = config.basePrice
  if (discountType === "percentage" && value > 0 && value <= 100) {
    effectivePrice = config.basePrice * (1 - value / 100)
  } else if (discountType === "fixed" && value > 0) {
    effectivePrice = Math.max(0, config.basePrice - value)
  }

  async function handleApply() {
    if (value <= 0) {
      toast.error("Please enter a valid discount value")
      return
    }
    if (discountType === "percentage" && (value < 1 || value > 100)) {
      toast.error("Percentage must be between 1 and 100")
      return
    }
    if (duration === "repeating" && (!durationInMonths || parseInt(durationInMonths) < 1)) {
      toast.error("Please enter duration in months")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/billing/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          discountType,
          discountValue: value,
          duration,
          durationInMonths: duration === "repeating" ? parseInt(durationInMonths) : undefined,
          reason: reason || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message || "Discount applied")
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      toast.error(err.message || "Failed to apply discount")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setDiscountType("percentage")
    setDiscountValue("")
    setDuration("forever")
    setDurationInMonths("")
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Create a Stripe coupon and apply it to this business&apos;s subscription.
          </DialogDescription>
        </DialogHeader>

        {isFoundingMember && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This is a founding member. Applying a new discount will replace their existing founding coupon.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {discountType === "percentage" ? "Percent Off" : "Amount Off ($)"}
              </label>
              <Input
                type="number"
                placeholder={discountType === "percentage" ? "e.g. 25" : "e.g. 30"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                min={discountType === "percentage" ? 1 : 0.01}
                max={discountType === "percentage" ? 100 : undefined}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Duration</label>
              <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forever">Forever</SelectItem>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="repeating">Repeating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {duration === "repeating" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Months</label>
                <Input
                  type="number"
                  placeholder="e.g. 6"
                  value={durationInMonths}
                  onChange={(e) => setDurationInMonths(e.target.value)}
                  min={1}
                />
              </div>
            )}
          </div>

          {/* Effective price preview */}
          {value > 0 && (
            <div className="p-3 rounded-lg bg-[--af-bg-surface-alt] border border-[--af-border-default]">
              <p className="text-sm">
                <span className="text-[--af-text-muted]">Effective price: </span>
                <span className="font-medium">
                  {config.name} (${config.basePrice}/mo){" "}
                  {discountType === "percentage" ? `- ${value}%` : `- $${value}`}{" "}
                  = <span className="text-[--af-success-text]">${effectivePrice.toFixed(2)}/mo</span>
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason (optional)</label>
            <Textarea
              placeholder="Why is this discount being applied?"
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
            {loading ? "Applying..." : "Apply Discount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
