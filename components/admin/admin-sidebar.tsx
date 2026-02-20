"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { adminNavItems } from "@/lib/admin/navigation"

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[210px] border-r border-[--af-border-sidebar] bg-[--af-bg-sidebar] flex flex-col">
      <div className="p-4 border-b border-[--af-border-sidebar]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-[1.5px] border-warm-900 rotate-45" />
          </div>
          <h1 className="text-[13px] font-display font-bold text-[--af-sidebar-text] tracking-tight">ArchaFlow Admin</h1>
        </div>
      </div>
      <nav className="flex-1 p-2.5 space-y-0.5">
        {adminNavItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            pathname === `/admin-portal${item.href}` ||
            pathname.startsWith(`/admin-portal${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-sidebar text-[13px] transition-colors",
                isActive
                  ? "bg-[--af-sidebar-active-bg] text-[--af-sidebar-active] font-semibold"
                  : "text-[--af-sidebar-muted] hover:bg-[--af-sidebar-active-bg] hover:text-[--af-sidebar-text]"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
