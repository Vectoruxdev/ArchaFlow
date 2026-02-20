export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--af-bg-surface]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[--af-border-default] dark:border-warm-600 border-t-foreground rounded-full animate-spin" />
        <p className="text-sm text-[--af-text-secondary]">Loading...</p>
      </div>
    </div>
  )
}
