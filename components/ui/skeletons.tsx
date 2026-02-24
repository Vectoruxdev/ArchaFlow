import { Skeleton } from "@/components/design-system"

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-[--af-border-default] rounded-card overflow-hidden">
      {/* Header */}
      <div className="bg-[--af-bg-surface-alt] px-6 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} width={i === 0 ? 120 : 80} rounded="sm" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-[--af-border-default]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="px-6 py-4 flex items-center gap-6">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                height={14}
                width={colIdx === 0 ? "40%" : `${60 + Math.random() * 40}px`}
                rounded="sm"
                className={colIdx === 0 ? "flex-1" : ""}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-[--af-border-default] rounded-card p-4 space-y-3"
        >
          <Skeleton height={12} width={80} rounded="sm" />
          <Skeleton height={28} width={60} rounded="sm" />
          <Skeleton height={10} width={100} rounded="sm" />
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton height={40} width={40} rounded="md" />
        <div className="space-y-2 flex-1">
          <Skeleton height={24} width="40%" rounded="sm" />
          <Skeleton height={14} width="25%" rounded="sm" />
        </div>
      </div>
      {/* Info card */}
      <div className="border border-[--af-border-default] rounded-card p-6 space-y-4">
        <Skeleton height={18} width={160} rounded="sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton height={12} width={80} rounded="sm" />
              <Skeleton height={16} width="70%" rounded="sm" />
            </div>
          ))}
        </div>
      </div>
      {/* Table card */}
      <div className="border border-[--af-border-default] rounded-card p-6 space-y-4">
        <Skeleton height={18} width={120} rounded="sm" />
        <TableSkeleton rows={3} cols={4} />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" style={{ padding: "var(--af-density-page-padding)" }}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height={28} width={160} rounded="sm" />
        <Skeleton height={14} width={200} rounded="sm" />
      </div>
      {/* Stats */}
      <CardGridSkeleton count={4} />
      <CardGridSkeleton count={4} />
      {/* Activity */}
      <div className="border border-[--af-border-default] rounded-card p-4 space-y-4">
        <Skeleton height={18} width={140} rounded="sm" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton height={32} width={32} rounded="full" />
            <div className="flex-1 space-y-2">
              <Skeleton height={14} width="80%" rounded="sm" />
              <Skeleton height={10} width={60} rounded="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div style={{ padding: "var(--af-density-page-padding)" }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton height={36} width={36} rounded="md" />
        <Skeleton height={24} width="30%" rounded="sm" />
      </div>
      {/* Form fields */}
      <div className="border border-[--af-border-default] rounded-card p-6 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton height={12} width={100} rounded="sm" />
            <Skeleton height={36} width="100%" rounded="md" />
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Skeleton height={36} width={80} rounded="md" />
        <Skeleton height={36} width={100} rounded="md" />
      </div>
    </div>
  )
}

export function KanbanSkeleton() {
  return (
    <div style={{ padding: "var(--af-density-page-padding)" }} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height={28} width={160} rounded="sm" />
        <Skeleton height={14} width={200} rounded="sm" />
      </div>
      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="border border-[--af-border-default] rounded-card p-4 space-y-3">
            <Skeleton height={16} width={100} rounded="sm" />
            {Array.from({ length: 3 }).map((_, card) => (
              <div key={card} className="border border-[--af-border-default] rounded-card p-3 space-y-2">
                <Skeleton height={14} width="80%" rounded="sm" />
                <Skeleton height={10} width="50%" rounded="sm" />
                <div className="flex gap-2">
                  <Skeleton height={20} width={50} rounded="sm" />
                  <Skeleton height={20} width={40} rounded="sm" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div style={{ padding: "var(--af-density-page-padding)" }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton height={64} width={64} rounded="full" />
        <div className="space-y-2">
          <Skeleton height={24} width={180} rounded="sm" />
          <Skeleton height={14} width={200} rounded="sm" />
        </div>
      </div>
      <div className="border border-[--af-border-default] rounded-card p-6 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton height={12} width={80} rounded="sm" />
            <Skeleton height={36} width="100%" rounded="md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function IntegrationsSkeleton() {
  return (
    <div style={{ padding: "var(--af-density-page-padding)" }} className="space-y-6">
      <div className="space-y-2">
        <Skeleton height={28} width={180} rounded="sm" />
        <Skeleton height={14} width={250} rounded="sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-[--af-border-default] rounded-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton height={40} width={40} rounded="md" />
              <div className="space-y-1 flex-1">
                <Skeleton height={16} width={100} rounded="sm" />
                <Skeleton height={10} width="70%" rounded="sm" />
              </div>
            </div>
            <Skeleton height={32} width="100%" rounded="md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListPageSkeleton() {
  return (
    <div style={{ padding: "var(--af-density-page-padding)", display: "flex", flexDirection: "column", gap: "var(--af-density-section-gap)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height={28} width={160} rounded="sm" />
          <Skeleton height={14} width={120} rounded="sm" />
        </div>
        <Skeleton height={36} width={120} rounded="md" />
      </div>
      {/* Search */}
      <Skeleton height={36} width="100%" className="max-w-md" rounded="md" />
      {/* Table */}
      <TableSkeleton rows={8} cols={5} />
    </div>
  )
}
