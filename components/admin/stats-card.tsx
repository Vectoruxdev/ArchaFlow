"use client"

import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
}

export function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-card p-5 shadow-af-card relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[--af-brand-light] opacity-60 pointer-events-none" />
      <div className="flex items-center justify-between mb-3 relative">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
          {title}
        </span>
        <Icon className="h-4 w-4 text-[--af-text-muted]" />
      </div>
      <div className="text-2xl font-display font-bold tracking-tight relative">{value}</div>
      {description && (
        <p className="text-[11px] text-[--af-text-muted] mt-1 relative">
          {description}
        </p>
      )}
    </div>
  )
}
