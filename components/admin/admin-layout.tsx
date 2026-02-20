"use client"

import { AdminSidebar } from "./admin-sidebar"
import { AdminTopbar } from "./admin-topbar"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[--af-bg-canvas]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-auto af-scroll p-6">{children}</main>
      </div>
    </div>
  )
}
