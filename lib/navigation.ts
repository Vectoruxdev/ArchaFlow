import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Workflow,
  FolderKanban,
  Users,
  FileText,
  FileSignature,
  UsersRound,
  Settings,
  Plug,
  Target,
} from "lucide-react"

export interface NavItem {
  icon: LucideIcon
  label: string
  href: string
  hotkey: string
}

export const navigationItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", hotkey: "⌘⇧D" },
  { icon: Workflow, label: "Workflow", href: "/workflow", hotkey: "⌘⇧W" },
  { icon: Target, label: "Leads", href: "/leads", hotkey: "⌘⇧L" },
  { icon: FolderKanban, label: "Projects", href: "/projects", hotkey: "⌘⇧P" },
  { icon: Users, label: "Clients", href: "/clients", hotkey: "⌘⇧C" },
  { icon: FileSignature, label: "Contracts", href: "/contracts", hotkey: "⌘⇧O" },
  { icon: FileText, label: "Invoices", href: "/invoices", hotkey: "⌘⇧I" },
  { icon: UsersRound, label: "Teams", href: "/teams", hotkey: "⌘⇧T" },
  { icon: Plug, label: "Integrations", href: "/integrations", hotkey: "⌘⇧E" },
  { icon: Settings, label: "Settings", href: "/settings", hotkey: "⌘⇧S" },
]

// Map hotkey display string to key combo for matching
const hotkeyToCombo: Record<string, { meta: boolean; shift: boolean; key: string }> = {
  "⌘⇧D": { meta: true, shift: true, key: "d" },
  "⌘⇧W": { meta: true, shift: true, key: "w" },
  "⌘⇧L": { meta: true, shift: true, key: "l" },
  "⌘⇧P": { meta: true, shift: true, key: "p" },
  "⌘⇧C": { meta: true, shift: true, key: "c" },
  "⌘⇧O": { meta: true, shift: true, key: "o" },
  "⌘⇧I": { meta: true, shift: true, key: "i" },
  "⌘⇧T": { meta: true, shift: true, key: "t" },
  "⌘⇧E": { meta: true, shift: true, key: "e" },
  "⌘⇧S": { meta: true, shift: true, key: "s" },
}

export function getNavItemByHotkey(e: KeyboardEvent): NavItem | undefined {
  const isMac = typeof navigator !== "undefined" && navigator.platform?.toLowerCase().includes("mac")
  const metaPressed = isMac ? e.metaKey : e.ctrlKey
  if (!metaPressed || !e.shiftKey) return undefined

  const key = e.key.toLowerCase()
  return navigationItems.find((item) => {
    const combo = hotkeyToCombo[item.hotkey]
    return combo && combo.key === key
  })
}

export const COMMAND_PALETTE_HOTKEY = "⌘K"
