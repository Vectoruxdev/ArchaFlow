"use client"

import { useState, useEffect, useRef } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const rafRef = useRef<number>()

  useEffect(() => {
    const from = prevValueRef.current
    const to = value
    prevValueRef.current = to

    if (from === to) return

    const duration = 400
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      const current = Math.round(from + (to - from) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value])

  return (
    <span
      className={cn(
        "tabular-nums font-semibold transition-colors duration-300",
        className
      )}
    >
      {displayValue}
    </span>
  )
}

function getScoreColor(score: number) {
  if (score >= 70) return "bg-[--af-success-bg]0"
  if (score >= 40) return "bg-[--af-warning-bg]0"
  return "bg-warm-400"
}

export interface LeadScoreSliderProps {
  value: number
  onValueChange: (value: number) => void
  onValueCommit?: (value: number) => void
  disabled?: boolean
}

export function LeadScoreSlider({
  value,
  onValueChange,
  onValueCommit,
  disabled = false,
}: LeadScoreSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex items-center gap-3">
      <SliderPrimitive.Root
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        onValueCommit={([v]) => {
          setIsDragging(false)
          onValueCommit?.(v)
        }}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        max={100}
        step={1}
        disabled={disabled}
        className="relative flex w-full touch-none select-none items-center group"
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-[--af-bg-surface-alt] dark:bg-warm-800">
          <SliderPrimitive.Range
            className={cn(
              "absolute h-full rounded-full transition-all duration-300 ease-out",
              getScoreColor(value)
            )}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-white dark:border-foreground bg-[--af-bg-surface] dark:bg-[--af-bg-surface-alt] shadow-md ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 hover:shadow-lg" />
      </SliderPrimitive.Root>
      <div
        className={cn(
          "flex h-10 w-14 shrink-0 items-center justify-center rounded-card border transition-all duration-300 min-w-[3.5rem]",
          "border-[--af-border-default] bg-[--af-bg-surface-alt]",
          value >= 70 && "border-[--af-success-border]/30 bg-[--af-success-bg]0/5 shadow-green-500/10",
          value >= 40 && value < 70 && "border-[--af-warning-border]/30 bg-[--af-warning-bg]0/5 shadow-yellow-500/10",
          value < 40 && "border-[--af-border-default] dark:border-warm-700",
          isDragging && "scale-105 shadow-lg"
        )}
      >
        <AnimatedNumber
          value={value}
          className={cn(
            "text-lg",
            value >= 70 && "text-[--af-success-text]",
            value >= 40 && value < 70 && "text-[--af-warning-text]",
            value < 40 && "text-[--af-text-secondary]"
          )}
        />
      </div>
    </div>
  )
}
