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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-950">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Something went wrong</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
