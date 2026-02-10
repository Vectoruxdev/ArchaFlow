"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  UsersRound,
  Settings,
  Search,
  Bell,
  Plug,
  Target,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Plus,
  Check,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/lib/auth/auth-context"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Target, label: "Leads", href: "/leads" },
  { icon: FolderKanban, label: "Projects", href: "/projects" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  { icon: UsersRound, label: "Teams", href: "/teams" },
  { icon: Plug, label: "Integrations", href: "/integrations" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const authContext = useAuth()
  const { user, workspaces, currentWorkspace, switchWorkspace, signOut } = authContext || {}
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  
  // Show actual workspace data or a loading placeholder
  const displayWorkspace = currentWorkspace || { id: "", name: "Loading...", icon: "🏢", role: "viewer" as const }

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", newState.toString())
  }

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isMobileMenuOpen])

  const handleLogout = async () => {
    try {
      if (signOut) {
        await signOut()
      } else {
        // Fallback if signOut is not available
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout failed:", error)
      // Redirect anyway on error
      router.push("/login")
    }
  }

  // Get user initials for avatar
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U"

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black z-40">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white dark:border-black rotate-45" />
                </div>
                <span className="font-semibold text-lg hidden sm:block">ArchaFlow</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, clients..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg p-1.5">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-black dark:bg-white text-white dark:text-black text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">My Account</span>
                      <span className="text-xs text-gray-500 font-normal">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`fixed top-16 left-0 bottom-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black z-30 transition-all duration-300 lg:translate-x-0 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } ${isCollapsed ? "lg:w-16" : "lg:w-64"} w-64`}
        >
          <div className="flex flex-col h-full">
            {/* Workspace Selector */}
            <div className={`p-4 ${isCollapsed ? "lg:p-2" : ""}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="w-full flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors">
                          <span className="text-2xl">{displayWorkspace.icon}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{displayWorkspace.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors group">
                      <span className="text-2xl flex-shrink-0">{displayWorkspace.icon}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-sm truncate">{displayWorkspace.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{displayWorkspace.role}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
                    </button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(workspaces && workspaces.length > 0 ? workspaces : [displayWorkspace]).map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => switchWorkspace?.(workspace.id)}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xl">{workspace.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{workspace.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{workspace.role}</p>
                      </div>
                      {workspace.id === displayWorkspace.id && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowCreateWorkspace(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Workspace</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Navigation Items */}
            <nav className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? "lg:p-2" : "p-4"}`}>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                
                if (isCollapsed) {
                  return (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            router.push(item.href)
                            setIsMobileMenuOpen(false)
                          }}
                          className={`w-full flex items-center justify-center p-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? "bg-gray-100 dark:bg-gray-900 text-black dark:text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      router.push(item.href)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-900 text-black dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Bottom Section */}
            <div className={`border-t border-gray-200 dark:border-gray-800 ${isCollapsed ? "lg:p-2" : "p-4"} space-y-1`}>
              {/* Collapse/Close Toggle */}
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (window.innerWidth >= 1024) {
                          toggleCollapsed()
                        } else {
                          setIsMobileMenuOpen(false)
                        }
                      }}
                      className="w-full flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 hidden lg:block" />
                      <X className="w-5 h-5 lg:hidden" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="hidden lg:block">Expand</p>
                    <p className="lg:hidden">Close</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={() => {
                    if (window.innerWidth >= 1024) {
                      toggleCollapsed()
                    } else {
                      setIsMobileMenuOpen(false)
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 hidden lg:block" />
                  <X className="w-5 h-5 lg:hidden" />
                  <span className="hidden lg:block">Collapse</span>
                  <span className="lg:hidden">Close</span>
                </button>
              )}

              {/* Logout Button */}
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`pt-16 transition-all duration-300 ${isCollapsed ? "lg:pl-16" : "lg:pl-64"}`}>
          {children}
        </main>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Create Workspace Dialog */}
        <CreateWorkspaceDialog
          open={showCreateWorkspace}
          onOpenChange={setShowCreateWorkspace}
        />
      </div>
    </TooltipProvider>
  )
}
