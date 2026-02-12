"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import {
  FolderKanban,
  Users,
  Target,
  User,
} from "lucide-react"
import { navigationItems, getNavItemByHotkey, COMMAND_PALETTE_HOTKEY } from "@/lib/navigation"
import { authFetch } from "@/lib/auth/auth-fetch"
import { useAuth } from "@/lib/auth/auth-context"

interface SearchResult {
  projects: { id: string; title: string; clientName: string | null }[]
  clients: { id: string; firstName: string; lastName: string; email: string | null }[]
  leads: { id: string; firstName: string; lastName: string; email: string | null; companyName: string | null }[]
  members: { userId: string; firstName: string; lastName: string; email: string }[]
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const businessId = currentWorkspace?.id

  const search = useCallback(
    async (q: string) => {
      if (!businessId || q.length < 2) {
        setResults(null)
        return
      }

      setIsLoading(true)
      try {
        const res = await authFetch(
          `/api/search?q=${encodeURIComponent(q)}&businessId=${encodeURIComponent(businessId)}`
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        } else {
          setResults({ projects: [], clients: [], leads: [], members: [] })
        }
      } catch {
        setResults({ projects: [], clients: [], leads: [], members: [] })
      } finally {
        setIsLoading(false)
      }
    },
    [businessId]
  )

  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      search(query)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, open, search])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults(null)
    }
  }, [open])

  const filteredPages = navigationItems.filter(
    (item) =>
      !query ||
      query.length < 2 ||
      item.label.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false)
      // Defer navigation until dialog has closed to avoid race conditions
      setTimeout(() => {
        router.push(href)
      }, 0)
    },
    [router, onOpenChange]
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search pages, projects, clients, leads..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : query.length >= 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type to search across the app
            </div>
          )}
        </CommandEmpty>

        {filteredPages.length > 0 && (
          <CommandGroup heading="Pages">
            {filteredPages.map((item) => (
              <CommandItem
                key={item.href}
                value={`page-${item.label}`}
                onSelect={() => handleSelect(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.hotkey}
                </Badge>
                <span className="ml-2 text-xs text-muted-foreground">Page</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && (query.length >= 2 || results.projects.length > 0) && (
          <>
            {results.projects.length > 0 && (
              <CommandGroup heading="Projects">
                {results.projects.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`project-${p.id}`}
                    onSelect={() => handleSelect(`/projects/${p.id}`)}
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span className="flex-1">{p.title}</span>
                    {p.clientName && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {p.clientName}
                      </span>
                    )}
                    <Badge variant="outline" className="ml-2 text-xs font-normal">
                      Project
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.clients.length > 0 && (
              <CommandGroup heading="Clients">
                {results.clients.map((c) => {
                  const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Unknown"
                  return (
                    <CommandItem
                      key={c.id}
                      value={`client-${c.id}`}
                      onSelect={() => handleSelect(`/clients/${c.id}`)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span className="flex-1">{name}</span>
                      {c.email && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {c.email}
                        </span>
                      )}
                      <Badge variant="outline" className="ml-2 text-xs font-normal">
                        Client
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {results.leads.length > 0 && (
              <CommandGroup heading="Leads">
                {results.leads.map((l) => {
                  const name =
                    [l.firstName, l.lastName].filter(Boolean).join(" ") ||
                    l.companyName ||
                    l.email ||
                    "Unknown"
                  return (
                    <CommandItem
                      key={l.id}
                      value={`lead-${l.id}`}
                      onSelect={() => handleSelect(`/leads/${l.id}`)}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      <span className="flex-1">{name}</span>
                      {l.companyName && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {l.companyName}
                        </span>
                      )}
                      <Badge variant="outline" className="ml-2 text-xs font-normal">
                        Lead
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {results.members.length > 0 && (
              <CommandGroup heading="Team">
                {results.members.map((m) => {
                  const name =
                    [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || "Unknown"
                  return (
                    <CommandItem
                      key={m.userId}
                      value={`member-${m.userId}`}
                      onSelect={() => handleSelect("/teams")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span className="flex-1">{name}</span>
                      {m.email && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {m.email}
                        </span>
                      )}
                      <Badge variant="outline" className="ml-2 text-xs font-normal">
                        Team
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        Press ↑↓ to navigate, Enter to select • {COMMAND_PALETTE_HOTKEY} to open
      </div>
    </CommandDialog>
  )
}

export function useGlobalSearchHotkeys(onOpen: () => void) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && navigator.platform?.toLowerCase().includes("mac")
      const meta = isMac ? e.metaKey : e.ctrlKey

      if (meta && e.key === "k") {
        e.preventDefault()
        onOpen()
        return
      }

      const navItem = getNavItemByHotkey(e)
      if (navItem) {
        e.preventDefault()
        router.push(navItem.href)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onOpen, router])
}
