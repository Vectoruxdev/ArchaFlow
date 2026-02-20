"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[--af-bg-surface] dark:bg-warm-950">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-display font-bold mb-2 text-foreground">Something went wrong</h2>
        <p className="text-sm text-[--af-text-muted] mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-warm-900 dark:bg-[--af-bg-surface] text-white dark:text-foreground rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
