"use client"

import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Sparkles, Check, AlertCircle, Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type SiteImageGenStep = "fetching" | "enhancing" | "saving" | "done" | "error" | null

interface SiteImageGenerationModalProps {
  step: SiteImageGenStep
  errorMessage?: string
  generatedImageUrl?: string
  onDismiss: () => void
}

const steps = [
  { key: "fetching", label: "Fetching property image...", icon: MapPin },
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

export function SiteImageGenerationModal({
  step,
  errorMessage,
  generatedImageUrl,
  onDismiss,
}: SiteImageGenerationModalProps) {
  const isOpen = step !== null
  const currentIndex = getStepIndex(step)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onDismiss() }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => {
        // Prevent dismissing during active generation
        if (step !== "done" && step !== "error") e.preventDefault()
      }}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === "done" ? "Site Image Generated" : step === "error" ? "Generation Failed" : "Generating Site Image"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "done"
              ? "Your AI-enhanced site image is ready."
              : step === "error"
                ? "Something went wrong during image generation."
                : "Please wait while we create your site image..."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            {step === "error" ? (
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
                {generatedImageUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full rounded-lg overflow-hidden border border-[--af-border-default]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedImageUrl}
                      alt="Generated site image"
                      className="w-full h-48 object-cover"
                    />
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
                {steps.map((s, i) => {
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
      </DialogContent>
    </Dialog>
  )
}
