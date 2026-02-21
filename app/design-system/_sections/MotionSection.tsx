"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heading, Text } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import {
  fadeIn,
  slideUp,
  slideDown,
  scaleIn,
  staggerChildren,
  staggerItem,
  duration,
} from "@/lib/design-system/motion"

const variants = [
  { name: "fadeIn", variant: fadeIn },
  { name: "slideUp", variant: slideUp },
  { name: "slideDown", variant: slideDown },
  { name: "scaleIn", variant: scaleIn },
] as const

export default function MotionSection() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const [staggerKey, setStaggerKey] = useState(0)

  const toggle = (name: string) => {
    setActiveDemo((prev) => (prev === name ? null : name))
  }

  return (
    <section id="motion">
      <Heading size="lg" className="mb-6">Motion</Heading>

      <div className="space-y-8">
        {/* Variant demos */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Animation Variants
          </Text>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {variants.map(({ name, variant }) => (
              <div key={name} className="flex flex-col items-center gap-3">
                <div className="h-24 w-full flex items-center justify-center bg-[--af-bg-surface] rounded-card border border-[--af-border-default] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeDemo === name && (
                      <motion.div
                        key={name}
                        variants={variant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-12 h-12 rounded-lg bg-[--af-brand-default]"
                      />
                    )}
                  </AnimatePresence>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggle(name)}
                >
                  {activeDemo === name ? "Hide" : name}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Stagger demo */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Stagger Children
          </Text>
          <div className="bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            <motion.div
              key={staggerKey}
              variants={staggerChildren(0.08)}
              initial="hidden"
              animate="visible"
              className="flex gap-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="w-10 h-10 rounded-lg bg-[--af-brand-light] border border-[--af-brand-border]"
                />
              ))}
            </motion.div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setStaggerKey((k) => k + 1)}
            >
              Replay
            </Button>
          </div>
        </div>

        {/* Duration scale */}
        <div>
          <Text weight="semibold" color="primary" className="mb-4">
            Duration Scale
          </Text>
          <div className="space-y-2 bg-[--af-bg-surface] rounded-card border border-[--af-border-default] p-6">
            {Object.entries(duration).map(([name, seconds]) => (
              <div key={name} className="flex items-center gap-4">
                <Text size="xs" color="muted" mono className="w-16 shrink-0">
                  {name}
                </Text>
                <div className="flex-1 h-2 bg-[--af-bg-surface-alt] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[--af-brand-default] rounded-full"
                    style={{ width: `${Math.min((seconds / 1.2) * 100, 100)}%` }}
                  />
                </div>
                <Text size="xs" color="muted" mono className="w-12 text-right">
                  {seconds}s
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
