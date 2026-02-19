"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/lib/admin/admin-auth-context"

export function AdminTopbar() {
  const { user, signOut } = useAdminAuth()

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Super Admin Portal
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  )
}
