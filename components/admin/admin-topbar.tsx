"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/lib/admin/admin-auth-context"

export function AdminTopbar() {
  const { user, signOut } = useAdminAuth()

  return (
    <header className="h-14 border-b border-[--af-border-default] bg-[--af-bg-surface] flex items-center justify-between px-6">
      <div className="text-[13px] text-[--af-text-secondary] font-mono uppercase tracking-wider">
        Super Admin Portal
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-[13px] text-[--af-text-secondary]">
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
