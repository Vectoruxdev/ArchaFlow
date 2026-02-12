"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientFormModal, type ClientFormData } from "@/components/clients/client-form-modal"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Eye,
  Archive,
  ArchiveRestore,
} from "lucide-react"

// Types
interface ClientContact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  description: string
}

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  description: string
  archivedAt: string | null
  createdAt: string
  totalProjects: number
  activeProjects: number
  contacts: ClientContact[]
}

export default function ClientsPage() {
  const router = useRouter()
  const { currentWorkspace, workspacesLoaded } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientFormData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeletingClient, setIsDeletingClient] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
  const itemsPerPage = 10

  const businessId = currentWorkspace?.id

  // Load clients from Supabase
  useEffect(() => {
    if (businessId) {
      loadClients()
    } else if (workspacesLoaded) {
      setIsLoading(false)
    }
  }, [businessId, workspacesLoaded])

  const loadClients = async () => {
    if (!businessId) return
    setIsLoading(true)
    setLoadError(null)

    try {
      // Fetch clients with sub-contacts
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*, client_contacts(*)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })

      if (clientsError) throw clientsError

      // Fetch project counts per client
      const { data: projectCounts, error: projectsError } = await supabase
        .from("projects")
        .select("client_id, archived_at")
        .eq("business_id", businessId)
        .not("client_id", "is", null)

      if (projectsError) throw projectsError

      // Build project count map
      const countMap: Record<string, { total: number; active: number }> = {}
      for (const proj of projectCounts || []) {
        if (!proj.client_id) continue
        if (!countMap[proj.client_id]) {
          countMap[proj.client_id] = { total: 0, active: 0 }
        }
        countMap[proj.client_id].total++
        if (!proj.archived_at) {
          countMap[proj.client_id].active++
        }
      }

      const transformed: Client[] = (clientsData || []).map((c: any) => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        description: c.description || "",
        archivedAt: c.archived_at,
        createdAt: c.created_at,
        totalProjects: countMap[c.id]?.total || 0,
        activeProjects: countMap[c.id]?.active || 0,
        contacts: (c.client_contacts || []).map((cc: any) => ({
          id: cc.id,
          firstName: cc.first_name,
          lastName: cc.last_name,
          email: cc.email || "",
          phone: cc.phone || "",
          role: cc.role || "",
          description: cc.description || "",
        })),
      }))

      setClients(transformed)
    } catch (error: any) {
      console.error("Error loading clients:", error)
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // CRUD: Create or Update client
  const handleSave = async (formData: ClientFormData) => {
    if (!businessId) throw new Error("No workspace selected")

    if (formData.id) {
      // UPDATE existing client
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          description: formData.description.trim() || null,
        })
        .eq("id", formData.id)

      if (updateError) throw updateError

      // Delete existing contacts and re-insert
      await supabase.from("client_contacts").delete().eq("client_id", formData.id)

      if (formData.contacts.length > 0) {
        const contactsInsert = formData.contacts
          .filter((c) => c.firstName.trim() || c.lastName.trim())
          .map((c) => ({
            client_id: formData.id!,
            first_name: c.firstName.trim(),
            last_name: c.lastName.trim(),
            email: c.email.trim() || null,
            phone: c.phone.trim() || null,
            role: c.role.trim() || null,
            description: c.description.trim() || null,
          }))

        if (contactsInsert.length > 0) {
          const { error: contactsError } = await supabase
            .from("client_contacts")
            .insert(contactsInsert)

          if (contactsError) throw contactsError
        }
      }
    } else {
      // CREATE new client
      const { data: newClient, error: insertError } = await supabase
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

      if (insertError) throw insertError

      // Insert sub-contacts
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
          const { error: contactsError } = await supabase
            .from("client_contacts")
            .insert(contactsInsert)

          if (contactsError) {
            console.error("Error inserting contacts:", contactsError)
          }
        }
      }
    }

    // Reload clients list
    await loadClients()
    setEditingClient(null)
  }

  // Archive client
  const archiveClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", clientId)

      if (error) throw error
      await loadClients()
    } catch (error: any) {
      console.error("Error archiving client:", error)
      alert("Failed to archive client: " + error.message)
    }
  }

  // Unarchive client
  const unarchiveClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ archived_at: null })
        .eq("id", clientId)

      if (error) throw error
      await loadClients()
    } catch (error: any) {
      console.error("Error unarchiving client:", error)
      alert("Failed to unarchive client: " + error.message)
    }
  }

  // Delete client (only from archived)
  const deleteClient = async () => {
    if (!deleteConfirm) return
    setIsDeletingClient(true)

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", deleteConfirm)

      if (error) throw error

      await loadClients()
      setDeleteConfirm(null)
    } catch (error: any) {
      console.error("Error deleting client:", error)
      alert("Failed to delete client: " + error.message)
    } finally {
      setIsDeletingClient(false)
    }
  }

  // Edit handler: convert Client to ClientFormData
  const handleEdit = (client: Client) => {
    setEditingClient({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      description: client.description,
      contacts: client.contacts.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        role: c.role,
        description: c.description,
      })),
    })
    setIsFormOpen(true)
  }

  // Filter and search
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        fullName.includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q) ||
        client.address.toLowerCase().includes(q)
      return matchesSearch
    })
  }, [clients, searchQuery])

  const activeClients = useMemo(
    () => filteredClients.filter((c) => !c.archivedAt),
    [filteredClients]
  )
  const archivedClients = useMemo(
    () => filteredClients.filter((c) => c.archivedAt),
    [filteredClients]
  )
  const displayClients =
    activeTab === "active" ? activeClients : archivedClients

  // Pagination
  const totalPages = Math.ceil(displayClients.length / itemsPerPage)
  const paginatedClients = displayClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading clients...</div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Empty State (no clients at all)
  if (clients.length === 0 && !searchQuery) {
    return (
      <AppLayout>
        <div className="p-6">
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to start managing your architecture projects"
            action={{
              label: "Add Client",
              onClick: () => setIsFormOpen(true),
            }}
          />
          <ClientFormModal
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open)
              if (!open) setEditingClient(null)
            }}
            client={editingClient}
            onSave={handleSave}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeClients.length} active, {archivedClients.length} archived
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "active" | "archived")}
        >
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeClients.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedClients.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Tab */}
          <TabsContent value="active" className="mt-4">
            {renderTable(paginatedClients, false)}
          </TabsContent>

          {/* Archived Tab */}
          <TabsContent value="archived" className="mt-4">
            {renderTable(paginatedClients, true)}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, displayClients.length)} of{" "}
              {displayClients.length} clients
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Client Form Modal */}
        <ClientFormModal
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) setEditingClient(null)
          }}
          client={editingClient}
          onSave={handleSave}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client Permanently?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                client and all associated contacts. Projects linked to this
                client will remain but will no longer reference this client.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeletingClient}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteClient}
                disabled={isDeletingClient}
              >
                {isDeletingClient ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )

  // Render table helper
  function renderTable(clientsList: Client[], isArchived: boolean) {
    if (clientsList.length === 0) {
      return (
        <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "No clients found matching your search."
              : isArchived
                ? "No archived clients."
                : "No active clients."}
          </p>
        </div>
      )
    }

    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-center">Projects</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsList.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <TableCell className="font-medium">
                  {client.firstName} {client.lastName}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{client.email || "—"}</p>
                    <p className="text-xs text-gray-500">
                      {client.phone || ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {client.address || "—"}
                </TableCell>
                <TableCell className="text-center">
                  {client.totalProjects}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      client.activeProjects > 0
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }
                  >
                    {client.activeProjects}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(client.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/clients/${client.id}`)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {!isArchived && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(client)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              archiveClient(client.id)
                            }}
                            className="text-orange-600"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive Client
                          </DropdownMenuItem>
                        </>
                      )}
                      {isArchived && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              unarchiveClient(client.id)
                            }}
                            className="text-blue-600"
                          >
                            <ArchiveRestore className="w-4 h-4 mr-2" />
                            Unarchive Client
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(client.id)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>
    )
  }
}
