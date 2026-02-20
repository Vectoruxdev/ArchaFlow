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
      {/* Decorative accent blob */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[--af-brand] opacity-[0.12]" />
      <div className="flex items-center justify-between mb-3 relative">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
          {title}
        </span>
        <div className="w-9 h-9 rounded-full flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-[--af-brand-text]" />
        </div>
      </div>
      <div className="text-[28px] font-display font-bold tracking-tight leading-none">{value}</div>
      {description && (
        <p className="text-[11px] text-[--af-text-muted] mt-1">
          {description}
        </p>
      )}
    </div>
  )
}
