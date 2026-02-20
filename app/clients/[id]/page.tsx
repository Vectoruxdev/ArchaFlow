"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MoreVertical,
  Archive,
  Edit,
  Mail,
  Phone,
  MapPin,
  User,
  Eye,
  FileSignature,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AppLayout } from "@/components/layout/app-layout"
import { ClientFormModal, type ClientFormData } from "@/components/clients/client-form-modal"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

interface ClientDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  description: string
  archivedAt: string | null
  createdAt: string
  contacts: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    description: string
  }[]
}

interface LinkedProject {
  id: string
  title: string
  status: string
  budget: number | null
  dueDate: string | null
  archivedAt: string | null
}

interface LinkedContract {
  id: string
  name: string
  status: string
  sentAt: string | null
  signedAt: string | null
}

const statusColors: Record<string, string> = {
  lead: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
  sale: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  design: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  completed: "bg-[--af-success-bg]0/10 text-[--af-success-text] border-[--af-success-border]/20",
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [projects, setProjects] = useState<LinkedProject[]>([])
  const [contracts, setContracts] = useState<LinkedContract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    loadClient()
    loadLinkedProjects()
    loadLinkedContracts()
  }, [params.id])

  const loadClient = async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*, client_contacts(*)")
        .eq("id", params.id)
        .single()

      if (error) throw error

      if (data) {
        setClient({
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          description: data.description || "",
          archivedAt: data.archived_at,
          createdAt: data.created_at,
          contacts: (data.client_contacts || []).map((cc: any) => ({
            id: cc.id,
            firstName: cc.first_name,
            lastName: cc.last_name,
            email: cc.email || "",
            phone: cc.phone || "",
            role: cc.role || "",
            description: cc.description || "",
          })),
        })
      }
    } catch (error: any) {
      console.error("Error loading client:", error)
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLinkedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, budget, due_date, archived_at")
        .eq("client_id", params.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setProjects(
        (data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          budget: p.budget,
          dueDate: p.due_date,
          archivedAt: p.archived_at,
        }))
      )
    } catch (error: any) {
      console.error("Error loading linked projects:", error)
    }
  }

  const loadLinkedContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, name, status, sent_at, signed_at")
        .eq("client_id", params.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setContracts(
        (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          sentAt: c.sent_at,
          signedAt: c.signed_at,
        }))
      )
    } catch (error: any) {
      console.error("Error loading linked contracts:", error)
    }
  }

  const archiveClient = async () => {
    if (!currentWorkspace?.id) return

    try {
      const { error } = await supabase
        .from("clients")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", params.id)

      if (error) throw error
      router.push("/clients")
    } catch (error: any) {
      console.error("Error archiving client:", error)
      toast.error("Failed to archive client: " + error.message)
    }
  }

  const handleEditSave = async (formData: ClientFormData) => {
    if (!currentWorkspace?.id) throw new Error("No workspace selected")

    // UPDATE client
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
      .eq("id", params.id)

    if (updateError) throw updateError

    // Delete and re-insert contacts
    await supabase.from("client_contacts").delete().eq("client_id", params.id)

    if (formData.contacts.length > 0) {
      const contactsInsert = formData.contacts
        .filter((c) => c.firstName.trim() || c.lastName.trim())
        .map((c) => ({
          client_id: params.id,
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

    // Reload client data
    await loadClient()
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/clients")
  }

  const editFormData: ClientFormData | null = client
    ? {
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
      }
    : null

  return (
    <AppLayout>
      <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-950">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[--af-bg-surface] border-b border-[--af-border-default]">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {isLoading ? (
                  <div>
                    <div className="h-8 w-48 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse mt-2" />
                  </div>
                ) : loadError ? (
                  <div>
                    <div className="text-[--af-danger-text]">Error loading client</div>
                    <p className="text-sm text-[--af-text-muted] mt-1">{loadError}</p>
                  </div>
                ) : client ? (
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight truncate">
                        {client.firstName} {client.lastName}
                      </h1>
                      {client.archivedAt && (
                        <Badge className="bg-[--af-bg-canvas]0/10 text-[--af-text-secondary] border-[--af-border-default] border">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[--af-text-muted] mt-1">
                      Client since{" "}
                      {new Date(client.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(true)}
                  disabled={!client}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Client
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Client
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-orange-600"
                      onClick={archiveClient}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {client && (
          <div className="p-6 space-y-6">
            {/* Client Information Card */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <h2 className="text-lg font-display font-bold mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                    <div>
                      <p className="text-sm text-[--af-text-muted]">Full Name</p>
                      <p className="font-medium">
                        {client.firstName} {client.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                    <div>
                      <p className="text-sm text-[--af-text-muted]">Email</p>
                      <p className="font-medium">{client.email || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                    <div>
                      <p className="text-sm text-[--af-text-muted]">Phone</p>
                      <p className="font-medium">{client.phone || "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                    <div>
                      <p className="text-sm text-[--af-text-muted]">Address</p>
                      <p className="font-medium">{client.address || "—"}</p>
                    </div>
                  </div>
                  {client.description && (
                    <div>
                      <p className="text-sm text-[--af-text-muted] mb-1">Description</p>
                      <p className="text-sm text-[--af-text-secondary] dark:text-[--af-text-muted]">
                        {client.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Contacts Card */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <h2 className="text-lg font-display font-bold mb-4">Contacts</h2>
              {client.contacts.length === 0 ? (
                <p className="text-sm text-[--af-text-muted] italic py-4">
                  No additional contacts associated with this client.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </TableCell>
                        <TableCell>
                          {contact.role ? (
                            <Badge className="bg-[--af-bg-surface-alt] dark:bg-warm-800 text-[--af-text-secondary]">
                              {contact.role}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{contact.email || "—"}</TableCell>
                        <TableCell>{contact.phone || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Linked Projects Card */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <h2 className="text-lg font-display font-bold mb-4">Projects</h2>
              {projects.length === 0 ? (
                <p className="text-sm text-[--af-text-muted] italic py-4">
                  No projects linked to this client yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <TableCell className="font-medium">
                          {project.title}
                          {project.archivedAt && (
                            <Badge className="ml-2 bg-[--af-bg-canvas]0/10 text-[--af-text-muted] text-xs">
                              Archived
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusColors[project.status] || statusColors.lead} border`}
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {project.budget
                            ? `$${project.budget.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {project.dueDate
                            ? new Date(project.dueDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/projects/${project.id}`)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Linked Contracts Card */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileSignature className="w-5 h-5 text-[--af-text-muted]" />
                <h2 className="text-lg font-display font-bold">Contracts</h2>
              </div>
              {contracts.length === 0 ? (
                <p className="text-sm text-[--af-text-muted] italic py-4">
                  No contracts sent to this client yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Signed</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow
                        key={contract.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/contracts/${contract.id}`)}
                      >
                        <TableCell className="font-medium text-sm">
                          {contract.name}
                        </TableCell>
                        <TableCell>
                          <ContractStatusBadge status={contract.status} />
                        </TableCell>
                        <TableCell className="text-sm text-[--af-text-muted]">
                          {contract.sentAt
                            ? new Date(contract.sentAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-[--af-text-muted]">
                          {contract.signedAt
                            ? new Date(contract.signedAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/contracts/${contract.id}`)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}

        {/* Edit Client Modal */}
        <ClientFormModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          client={editFormData}
          onSave={handleEditSave}
        />
      </div>
    </AppLayout>
  )
}
