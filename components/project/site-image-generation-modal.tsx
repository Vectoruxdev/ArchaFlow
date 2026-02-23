"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Sparkles, Check, AlertCircle, Save, Map, Wand2, Layers, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type EnhanceMode = "original" | "enhanced" | "both"
export type SiteImageGenStep = "options" | "fetching" | "enhancing" | "saving" | "done" | "error" | null

interface SiteImageGenerationModalProps {
  step: SiteImageGenStep
  errorMessage?: string
  generatedImageUrls?: string[]
  onDismiss: () => void
  onStart?: (mode: EnhanceMode) => void
  creditsRemaining?: number
  creditsLimit?: number
}

const progressSteps = [
  { key: "fetching", label: "Fetching property images...", icon: MapPin },
  { key: "enhancing", label: "Enhancing with AI...", icon: Sparkles },
  { key: "saving", label: "Saving to project...", icon: Save },
] as const

function getStepIndex(step: SiteImageGenStep): number {
  if (step === "fetching") return 0
  if (step === "enhancing") return 1
  if (step === "saving") return 2
  if (step === "done") return 3
  return -1
}

const modeOptions: { value: EnhanceMode; label: string; description: string; icon: typeof Map; creditCost: string }[] = [
  {
    value: "original",
    label: "Google Maps Only",
    description: "Raw street view + aerial images, no AI enhancement",
    icon: Map,
    creditCost: "Free",
  },
  {
    value: "enhanced",
    label: "AI Enhanced Only",
    description: "Gemini-enhanced architectural photos only",
    icon: Wand2,
    creditCost: "5-10 credits",
  },
  {
    value: "both",
    label: "Both",
    description: "Save originals and AI-enhanced versions (up to 4 images)",
    icon: Layers,
    creditCost: "5-10 credits",
  },
]

export function SiteImageGenerationModal({
  step,
  errorMessage,
  generatedImageUrls,
  onDismiss,
  onStart,
  creditsRemaining,
  creditsLimit,
}: SiteImageGenerationModalProps) {
  const [selectedMode, setSelectedMode] = useState<EnhanceMode>("enhanced")
  const isOpen = step !== null
  const currentIndex = getStepIndex(step)

  const hasCreditsInfo = creditsRemaining !== undefined && creditsLimit !== undefined
  const needsCredits = selectedMode !== "original"
  const insufficientCredits = hasCreditsInfo && needsCredits && creditsRemaining < 5

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDismiss() }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
        // Prevent dismissing during active generation
        if (step !== "done" && step !== "error" && step !== "options") e.preventDefault()
      }}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === "options"
              ? "Generate Site Images"
              : step === "done"
                ? "Site Images Generated"
                : step === "error"
                  ? "Generation Failed"
                  : "Generating Site Images"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "options"
              ? "Choose how to generate images for this property."
              : step === "done"
                ? "Your site images are ready."
                : step === "error"
                  ? "Something went wrong during image generation."
                  : "Please wait while we create your site images..."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            {step === "options" ? (
              <motion.div
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {modeOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedMode === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedMode(option.value)}
                      className={`w-full flex items-start gap-3 rounded-lg px-4 py-3 text-left transition-colors border ${
                        isSelected
                          ? "bg-[--af-brand]/5 border-[--af-brand]/30"
                          : "bg-[--af-bg-surface-alt] border-transparent hover:border-[--af-border-default]"
                      }`}
                    >
                      <div className={`mt-0.5 ${isSelected ? "text-[--af-brand]" : "text-[--af-text-muted]"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isSelected ? "text-[--af-brand]" : ""}`}>
                            {option.label}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            option.creditCost === "Free"
                              ? "bg-[--af-success-bg] text-[--af-success-text]"
                              : "bg-[--af-bg-surface-alt] text-[--af-text-muted]"
                          }`}>
                            {option.creditCost}
                          </span>
                        </div>
                        <p className="text-xs text-[--af-text-muted] mt-0.5">{option.description}</p>
                      </div>
                      {isSelected && (
                        <div className="mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-[--af-brand] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* Credits remaining bar */}
                {hasCreditsInfo && (
                  <div className="mt-2 px-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[--af-text-muted]">AI Credits</span>
                      <span className="text-xs text-[--af-text-secondary]">
                        {creditsRemaining} / {creditsLimit} remaining
                      </span>
                    </div>
                    <div className="w-full bg-[--af-bg-surface-alt] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          creditsRemaining < 5
                            ? "bg-orange-500"
                            : "bg-[--af-success-text]"
                        }`}
                        style={{
                          width: `${Math.min(100, (creditsRemaining / Math.max(creditsLimit, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Insufficient credits warning */}
                {insufficientCredits && (
                  <div className="flex items-start gap-2 mt-2 px-1 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
                    <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                      Not enough credits for AI enhancement. Choose &quot;Google Maps Only&quot; or upgrade your plan for more credits.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : step === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-[--af-danger-bg] flex items-center justify-center"
                >
                  <AlertCircle className="w-8 h-8 text-[--af-danger-text]" />
                </motion.div>
                <p className="text-sm text-[--af-danger-text] text-center max-w-sm px-2">
                  {errorMessage || "An unexpected error occurred."}
                </p>
                <Button variant="outline" size="sm" onClick={onDismiss}>
                  Dismiss
                </Button>
              </motion.div>
            ) : step === "done" ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-[--af-success-bg] flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-[--af-success-text]" />
                </motion.div>
                {generatedImageUrls && generatedImageUrls.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full"
                  >
                    <div className={`grid gap-2 ${generatedImageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {generatedImageUrls.map((url, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-[--af-border-default]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Generated site image ${i + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[--af-text-muted] text-center mt-2">
                      {generatedImageUrls.length} image{generatedImageUrls.length !== 1 ? "s" : ""} generated
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {progressSteps.map((s, i) => {
                  const isActive = s.key === step
                  const isCompleted = currentIndex > i
                  const Icon = s.icon

                  return (
                    <motion.div
                      key={s.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-[--af-brand]/5 border border-[--af-brand]/20"
                          : isCompleted
                            ? "bg-[--af-success-bg] border border-[--af-success-border]"
                            : "bg-[--af-bg-surface-alt] border border-transparent"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {isActive ? (
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          >
                            <Icon className="w-5 h-5 text-[--af-brand]" />
                          </motion.div>
                        ) : isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                          >
                            <Check className="w-5 h-5 text-[--af-success-text]" />
                          </motion.div>
                        ) : (
                          <Icon className="w-5 h-5 text-[--af-text-muted]" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-[--af-brand]"
                            : isCompleted
                              ? "text-[--af-success-text]"
                              : "text-[--af-text-muted]"
                        }`}
                      >
                        {isCompleted ? s.label.replace("...", "") : s.label}
                      </span>
                      {isActive && (
                        <motion.div
                          className="ml-auto"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <div className="w-4 h-4 border-2 border-[--af-brand]/30 border-t-[--af-brand] rounded-full" />
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === "options" && (
          <DialogFooter>
            <Button variant="outline" onClick={onDismiss}>
              Cancel
            </Button>
            <Button onClick={() => onStart?.(selectedMode)} disabled={insufficientCredits}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
