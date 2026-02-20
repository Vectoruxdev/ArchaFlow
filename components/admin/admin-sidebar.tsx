"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { adminNavItems } from "@/lib/admin/navigation"

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-semibold">ArchaFlow Admin</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon
          // usePathname() returns the browser URL on admin subdomain (e.g. "/dashboard")
          // or the rewritten path without subdomain ("/admin-portal/dashboard")
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
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
