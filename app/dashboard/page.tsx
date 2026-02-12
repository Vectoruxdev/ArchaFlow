"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/workflow")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center animate-pulse">
          <div className="w-5 h-5 border-2 border-white dark:border-black rotate-45" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  )
}
