"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { recordActivity } from "@/lib/activity"
import { useAuth } from "@/lib/auth/auth-context"
import { ClientFormModal, type ClientFormData } from "@/components/clients/client-form-modal"
import { Search, X, Plus, User } from "lucide-react"

interface ClientOption {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ClientSelectProps {
  value: { clientId: string | null; displayName: string }
  onChange: (value: { clientId: string | null; displayName: string }) => void
  placeholder?: string
}

export function ClientSelect({
  value,
  onChange,
  placeholder = "Search for a client...",
}: ClientSelectProps) {
  const { currentWorkspace, user } = useAuth()
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<ClientOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const businessId = currentWorkspace?.id

  // Search clients as user types
  const searchClients = useCallback(
    async (searchTerm: string) => {
      if (!businessId) return

      setIsLoading(true)
      try {
        let queryBuilder = supabase
          .from("clients")
          .select("id, first_name, last_name, email")
          .eq("business_id", businessId)
          .is("archived_at", null)
          .order("first_name", { ascending: true })
          .limit(10)

        if (searchTerm.trim()) {
          // Search by name or email using ilike
          queryBuilder = queryBuilder.or(
            `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
          )
        }

        const { data, error } = await queryBuilder

        if (error) throw error

        setOptions(
          (data || []).map((c: any) => ({
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            email: c.email || "",
          }))
        )
      } catch (error) {
        console.error("Error searching clients:", error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    },
    [businessId]
  )

  // Debounced search
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      searchClients(query)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, isOpen, searchClients])

  // Load initial options when dropdown opens
  useEffect(() => {
    if (isOpen) {
      searchClients(query)
    }
  }, [isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSelect = (client: ClientOption) => {
    onChange({
      clientId: client.id,
      displayName: `${client.firstName} ${client.lastName}`,
    })
    setQuery("")
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange({ clientId: null, displayName: "" })
    setQuery("")
  }

  const handleCreateNew = () => {
    setIsOpen(false)
    setIsCreateOpen(true)
  }

  const handleNewClientSave = async (formData: ClientFormData) => {
    if (!businessId) throw new Error("No workspace selected")

    // Create the client
    const { data: newClient, error } = await supabase
      .from("clients")
      .insert([
        {
          business_id: businessId,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          description: formData.description.trim() || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    if (businessId && newClient) {
      recordActivity({
        businessId,
        userId: user?.id,
        activityType: "client_created",
        entityType: "client",
        entityId: newClient.id,
        message: `Client "${newClient.first_name} ${newClient.last_name}" added`,
      }).catch(() => {})
    }

    // Insert sub-contacts if any
    if (formData.contacts.length > 0 && newClient) {
      const contactsInsert = formData.contacts
        .filter((c) => c.firstName.trim() || c.lastName.trim())
        .map((c) => ({
          client_id: newClient.id,
          first_name: c.firstName.trim(),
          last_name: c.lastName.trim(),
          email: c.email.trim() || null,
          phone: c.phone.trim() || null,
          role: c.role.trim() || null,
          description: c.description.trim() || null,
        }))

      if (contactsInsert.length > 0) {
        await supabase.from("client_contacts").insert(contactsInsert)
      }
    }

    // Auto-select the newly created client
    onChange({
      clientId: newClient.id,
      displayName: `${newClient.first_name} ${newClient.last_name}`,
    })
    setQuery("")
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Selected client display or search input */}
      {value.clientId ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-[--af-border-default] dark:border-warm-800 rounded-lg bg-[--af-bg-canvas] dark:bg-warm-900">
          <User className="w-4 h-4 text-[--af-text-muted]" />
          <span className="flex-1 text-sm font-medium">{value.displayName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 hover:bg-[--af-bg-surface-alt] dark:hover:bg-warm-800 rounded"
          >
            <X className="w-4 h-4 text-[--af-text-muted]" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[--af-text-muted]" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !value.clientId && (
        <div className="absolute z-50 w-full mt-1 bg-[--af-bg-surface] dark:bg-warm-900 border border-[--af-border-default] dark:border-warm-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-[--af-text-muted]">Searching...</div>
          )}

          {!isLoading && options.length === 0 && (
            <div className="px-4 py-3 text-sm text-[--af-text-muted]">
              {query ? "No clients found." : "No clients in this workspace."}
            </div>
          )}

          {!isLoading &&
            options.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                className="w-full text-left px-4 py-2.5 hover:bg-[--af-bg-surface-alt] dark:hover:bg-warm-900 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[--af-bg-surface-alt] dark:bg-warm-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-[--af-text-secondary] dark:text-[--af-text-muted]">
                    {client.firstName.charAt(0)}
                    {client.lastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {client.firstName} {client.lastName}
                  </p>
                  {client.email && (
                    <p className="text-xs text-[--af-text-muted] truncate">
                      {client.email}
                    </p>
                  )}
                </div>
              </button>
            ))}

          {/* Add new client option */}
          <div className="border-t border-[--af-border-default] dark:border-warm-800">
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full text-left px-4 py-2.5 hover:bg-[--af-bg-surface-alt] dark:hover:bg-warm-900 flex items-center gap-3 text-[--af-info-text] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">
                {query
                  ? `Add "${query}" as new client`
                  : "Add new client"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Create client modal */}
      <ClientFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        client={
          query
            ? {
                firstName: query.split(" ")[0] || "",
                lastName: query.split(" ").slice(1).join(" ") || "",
                email: "",
                phone: "",
                address: "",
                description: "",
                contacts: [],
              }
            : null
        }
        onSave={handleNewClientSave}
      />
    </div>
  )
}
