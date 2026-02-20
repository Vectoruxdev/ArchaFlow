"use client"

import React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon | React.ReactNode
  description?: string
  descriptionColor?: "muted" | "success" | "warning" | "danger"
  valueColor?: "default" | "success" | "warning" | "danger"
  showBlob?: boolean
  progress?: number
  href?: string
  valueSuffix?: React.ReactNode
  className?: string
  variant?: "default" | "compact"
}

const descriptionColorMap = {
  muted: "text-[--af-text-muted]",
  success: "text-[--af-success-text]",
  warning: "text-[--af-warning-text]",
  danger: "text-[--af-danger-text]",
}

const valueColorMap = {
  default: "",
  success: "text-[--af-success-text]",
  warning: "text-[--af-warning-text]",
  danger: "text-[--af-danger-text]",
}

function isLucideIcon(icon: LucideIcon | React.ReactNode): icon is LucideIcon {
  return typeof icon === "function" || (typeof icon === "object" && icon !== null && "render" in icon)
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  descriptionColor = "muted",
  valueColor = "default",
  showBlob,
  progress,
  href,
  valueSuffix,
  className,
  variant = "default",
}: StatsCardProps) {
  const isCompact = variant === "compact"
  const blob = showBlob ?? !isCompact

  const card = (
    <div
      className={cn(
        "bg-[--af-bg-surface] border border-[--af-border-default] rounded-card shadow-af-card relative overflow-hidden",
        isCompact ? "p-5" : "p-3 sm:p-4 lg:p-5",
        href && "hover:border-[--af-border-strong] transition-colors cursor-pointer",
        className,
      )}
    >
      {blob && (
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[--af-brand] opacity-[0.12]" />
      )}
      <div className="flex items-center justify-between gap-2 min-w-0 mb-3 relative">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
          {title}
        </span>
        {isCompact ? (
          isLucideIcon(icon) ? (
            React.createElement(icon, { className: "w-4 h-4 text-[--af-text-muted]" })
          ) : (
            icon
          )
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
            {isLucideIcon(icon) ? (
              React.createElement(icon, { className: "w-[18px] h-[18px] text-[--af-brand-text]" })
            ) : (
              icon
            )}
          </div>
        )}
      </div>
      <div
        className={cn(
          "font-display font-bold tracking-tight leading-none",
          isCompact ? "text-2xl" : "text-[28px]",
          valueColorMap[valueColor],
        )}
      >
        {value}
        {valueSuffix}
      </div>
      {progress != null ? (
        <div className="mt-1 sm:mt-2 h-1.5 bg-[--af-bg-surface-alt] rounded-full overflow-hidden">
          <div
            className="h-full bg-warm-900 dark:bg-[--af-bg-surface] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : description ? (
        <p className={cn("text-[11px] mt-1", descriptionColorMap[descriptionColor])}>
          {description}
        </p>
      ) : null}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className={className ? undefined : undefined}>
        {card}
      </Link>
    )
  }

  return card
}
