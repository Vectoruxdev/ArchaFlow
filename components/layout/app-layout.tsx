"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Workflow,
  Search,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Plus,
  Check,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog"
import { ChangelogDialog } from "@/components/ui/changelog-dialog"
import { GlobalSearch, useGlobalSearchHotkeys } from "@/components/search/global-search"
import { navigationItems } from "@/lib/navigation"
import { APP_VERSION } from "@/lib/app-version"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const authContext = useAuth()
  const { user, workspaces, workspacesLoaded, currentWorkspace, switchWorkspace, signOut, loading: authLoading } = authContext || {}
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Redirect unauthenticated users to login, workspaceless users to onboarding
  useEffect(() => {
    if (authLoading || !isSupabaseConfigured()) return
    if (!user) {
      router.push("/login")
    } else if (workspacesLoaded && workspaces && workspaces.length === 0) {
      router.push("/onboarding")
    }
  }, [authLoading, user, workspacesLoaded, workspaces, router])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  const openSearch = useCallback(() => setSearchOpen(true), [])

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) return
    const loadAvatar = async () => {
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single()
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      } catch {
        /* ignore */
      }
    }
    loadAvatar()
  }, [user?.id])

  useEffect(() => {
    const onAvatarUpdated = (e: CustomEvent<{ url: string }>) => {
      setAvatarUrl(e.detail.url)
    }
    window.addEventListener("avatar-updated", onAvatarUpdated as EventListener)
    return () => window.removeEventListener("avatar-updated", onAvatarUpdated as EventListener)
  }, [])
  useGlobalSearchHotkeys(openSearch)

  // Show actual workspace data or a loading placeholder
  const displayWorkspace = currentWorkspace || { id: "", name: "Loading...", icon: "🏢", role: "viewer" as const }

  /** Extract up to 2 initials from workspace name */
  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("")

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
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout failed:", error)
      router.push("/login")
    }
  }

  // Get user initials for avatar
  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U"

  // Show loading while checking auth or redirecting to login
  if (authLoading || (isSupabaseConfigured() && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--af-bg-canvas]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-[--af-brand] rounded-lg flex items-center justify-center animate-pulse">
            <div className="w-5 h-5 border-2 border-[--af-text-inverse] rotate-45" />
          </div>
          <p className="text-sm text-[--af-text-muted]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-[--af-bg-canvas]">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 h-14 border-b border-[--af-border-default] bg-[--af-bg-surface] z-40">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-[--af-bg-surface-alt] rounded-sidebar transition-colors"
              >
                <Workflow className="w-5 h-5 text-[--af-text-secondary]" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[--af-brand] rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[--af-text-inverse] dark:border-[--af-text-inverse] rotate-45" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight hidden sm:block text-[--af-text-primary]">ArchaFlow</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 pl-10 pr-4 py-2 text-sm text-left bg-[--af-bg-surface-alt] border border-[--af-border-default] rounded-[--af-radius-input] hover:bg-[--af-bg-surface-hover] focus:outline-none focus:ring-2 focus:ring-[--af-border-focus] transition-colors"
              >
                <Search className="w-4 h-4 text-[--af-text-muted] shrink-0" />
                <span className="text-[--af-text-muted]">Search pages, projects, clients...</span>
                <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[--af-border-default] bg-[--af-bg-surface-alt] px-1.5 font-mono text-[10px] font-medium text-[--af-text-muted]">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[--af-danger-text] rounded-full" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-[--af-bg-surface-alt] rounded-lg p-1.5 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={avatarUrl} alt="" />
                      <AvatarFallback className="bg-[--af-brand] text-[--af-text-inverse] dark:text-[--af-text-inverse] text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">My Account</span>
                      <span className="text-xs text-[--af-text-muted] font-normal">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Sidebar — Dark in light mode, darker in dark mode */}
        <aside
          className={`fixed top-14 left-0 bottom-0 bg-[--af-bg-sidebar] border-r border-[--af-border-sidebar] z-30 transition-all duration-300 lg:translate-x-0 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } ${isCollapsed ? "lg:w-[60px]" : "lg:w-[250px]"} w-[250px]`}
        >
          <div className="flex flex-col h-full">
            {/* Workspace Selector */}
            <div className={`p-3 border-b border-[--af-border-sidebar] ${isCollapsed ? "lg:p-2" : ""}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="w-full flex items-center justify-center p-2 hover:bg-[--af-sidebar-active-bg] rounded-sidebar transition-colors">
                          <span className="w-8 h-8 rounded-lg bg-[--af-brand] flex items-center justify-center text-[11px] font-semibold tracking-wide text-[--af-text-inverse] flex-shrink-0">
                            {getInitials(displayWorkspace.name)}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{displayWorkspace.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <button className="w-full flex items-center gap-2.5 p-2.5 hover:bg-[--af-sidebar-active-bg] rounded-sidebar transition-colors group">
                      <span className="w-8 h-8 rounded-lg bg-[--af-brand] flex items-center justify-center text-[11px] font-semibold tracking-wide text-[--af-text-inverse] flex-shrink-0">
                        {getInitials(displayWorkspace.name)}
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-sm truncate text-[--af-sidebar-text]">{displayWorkspace.name}</p>
                        <p className="text-[11px] text-[--af-sidebar-muted] capitalize">{displayWorkspace.role}</p>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-[--af-sidebar-muted] group-hover:text-[--af-sidebar-text] flex-shrink-0" />
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
                      <span className="w-7 h-7 rounded-md bg-[--af-brand] flex items-center justify-center text-[10px] font-semibold tracking-wide text-[--af-text-inverse] flex-shrink-0">
                        {getInitials(workspace.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{workspace.name}</p>
                        <p className="text-xs text-[--af-text-muted] capitalize">{workspace.role}</p>
                      </div>
                      {workspace.id === displayWorkspace.id && (
                        <Check className="w-4 h-4 text-[--af-success-text]" />
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
            <nav className={`flex-1 space-y-1 overflow-y-auto af-scroll ${isCollapsed ? "lg:px-2" : "px-3"} py-3`}>
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
                          className={`w-full flex items-center justify-center p-2.5 rounded-sidebar transition-colors ${
                            isActive
                              ? "bg-[--af-sidebar-active-bg] text-[--af-sidebar-active]"
                              : "text-[--af-sidebar-muted] hover:bg-[--af-sidebar-active-bg] hover:text-[--af-sidebar-text]"
                          }`}
                        >
                          <item.icon className="w-[22px] h-[22px]" />
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sidebar text-[15px] transition-colors ${
                      isActive
                        ? "bg-[--af-sidebar-active-bg] text-[--af-sidebar-active] font-semibold"
                        : "text-[--af-sidebar-muted] hover:bg-[--af-sidebar-active-bg] hover:text-[--af-sidebar-text]"
                    }`}
                  >
                    <item.icon className="w-[22px] h-[22px] shrink-0" />
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[--af-sidebar-active] shrink-0" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Bottom Section */}
            <div className={`border-t border-[--af-border-sidebar] ${isCollapsed ? "lg:p-2" : "p-3"} space-y-1`}>
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
                      className="w-full flex items-center justify-center p-2 rounded-sidebar text-[--af-sidebar-muted] hover:bg-[--af-sidebar-active-bg] hover:text-[--af-sidebar-text] transition-colors"
                    >
                      <ChevronRight className="w-[22px] h-[22px] hidden lg:block" />
                      <X className="w-[22px] h-[22px] lg:hidden" />
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sidebar text-[15px] text-[--af-sidebar-muted] hover:bg-[--af-sidebar-active-bg] hover:text-[--af-sidebar-text] transition-colors"
                >
                  <ChevronLeft className="w-[22px] h-[22px] hidden lg:block" />
                  <X className="w-[22px] h-[22px] lg:hidden" />
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
                      className="w-full flex items-center justify-center p-2 rounded-sidebar text-[--af-danger-text] hover:bg-[rgba(168,64,64,0.12)] transition-colors"
                    >
                      <LogOut className="w-[22px] h-[22px]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sidebar text-[15px] text-[--af-danger-text] hover:bg-[rgba(168,64,64,0.12)] transition-colors"
                >
                  <LogOut className="w-[22px] h-[22px]" />
                  <span>Logout</span>
                </button>
              )}

              {/* Version Number */}
              <button
                onClick={() => setShowChangelog(true)}
                className={`w-full text-[11px] text-[--af-sidebar-muted] hover:text-[--af-sidebar-text] cursor-pointer transition-colors ${isCollapsed ? "flex justify-center py-1" : "px-2.5 py-1 text-left"}`}
              >
                {APP_VERSION}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`pt-14 transition-all duration-300 ${isCollapsed ? "lg:pl-[60px]" : "lg:pl-[250px]"}`}>
          {children}
        </main>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-[--af-bg-scrim] z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Create Workspace Dialog */}
        <CreateWorkspaceDialog
          open={showCreateWorkspace}
          onOpenChange={setShowCreateWorkspace}
        />

        {/* Changelog Dialog */}
        <ChangelogDialog open={showChangelog} onOpenChange={setShowChangelog} />

        {/* Global Search */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  )
}
