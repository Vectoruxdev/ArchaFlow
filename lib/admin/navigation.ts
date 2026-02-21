import { LayoutDashboard, Building2, Settings, Palette } from "lucide-react"

export interface AdminNavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Businesses", href: "/businesses", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Design System", href: "/design-system", icon: Palette },
]
