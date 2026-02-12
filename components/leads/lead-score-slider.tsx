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
  if (score >= 70) return "bg-green-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-gray-400"
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
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <SliderPrimitive.Range
            className={cn(
              "absolute h-full rounded-full transition-all duration-300 ease-out",
              getScoreColor(value)
            )}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-white dark:border-gray-900 bg-white dark:bg-gray-100 shadow-md ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 hover:shadow-lg" />
      </SliderPrimitive.Root>
      <div
        className={cn(
          "flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 min-w-[3.5rem]",
          "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900",
          value >= 70 && "border-green-500/30 bg-green-500/5 shadow-green-500/10",
          value >= 40 && value < 70 && "border-yellow-500/30 bg-yellow-500/5 shadow-yellow-500/10",
          value < 40 && "border-gray-300 dark:border-gray-700",
          isDragging && "scale-105 shadow-lg"
        )}
      >
        <AnimatedNumber
          value={value}
          className={cn(
            "text-lg",
            value >= 70 && "text-green-600 dark:text-green-400",
            value >= 40 && value < 70 && "text-yellow-600 dark:text-yellow-400",
            value < 40 && "text-gray-600 dark:text-gray-400"
          )}
        />
      </div>
    </div>
  )
}
