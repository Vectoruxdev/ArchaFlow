import { LayoutDashboard, Building2 } from "lucide-react"

export interface AdminNavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Businesses", href: "/businesses", icon: Building2 },
]
