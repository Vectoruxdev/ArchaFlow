"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadFormModal, type LeadFormData } from "@/components/leads/lead-form-modal"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Target,
  Eye,
  Archive,
  ArchiveRestore,
  ArrowRightCircle,
} from "lucide-react"

// Types
interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  jobTitle: string
  address: string
  source: string
  interest: string
  painPoints: string
  budgetMin: number | null
  budgetMax: number | null
  temperature: string
  status: string
  leadScore: number
  nextAction: string
  nextActionDate: string | null
  notes: string
  industry: string
  companySize: string
  location: string
  assignedTo: string | null
  assignedName: string | null
  clientId: string | null
  projectId: string | null
  convertedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

const sourceLabels: Record<string, string> = {
  website_form: "Website",
  email_campaign: "Email",
  social_media: "Social",
  referral: "Referral",
  cold_call: "Cold Call",
  ad: "Ad",
  trade_show: "Trade Show",
  other: "Other",
}

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
}

function TemperatureBadge({ temperature }: { temperature: string }) {
  const colors: Record<string, string> = {
    cold: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    warm: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    hot: "bg-red-500/10 text-red-600 dark:text-red-400",
  }
  return (
    <Badge className={colors[temperature] || "bg-gray-100 text-gray-600"}>
      {temperature.charAt(0).toUpperCase() + temperature.slice(1)}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-purple-500/10 text-purple-600",
    contacted: "bg-blue-500/10 text-blue-600",
    qualified: "bg-green-500/10 text-green-600",
    proposal: "bg-orange-500/10 text-orange-600",
    negotiation: "bg-yellow-500/10 text-yellow-600",
    won: "bg-emerald-500/10 text-emerald-600",
    lost: "bg-gray-500/10 text-gray-500",
  }
  return (
    <Badge className={colors[status] || "bg-gray-100 text-gray-600"}>
      {statusLabels[status] || status}
    </Badge>
  )
}

export default function LeadsPage() {
  const router = useRouter()
  const { currentWorkspace, user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [temperatureFilter, setTemperatureFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<LeadFormData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeletingLead, setIsDeletingLead] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"active" | "converted" | "archived">("active")
  const [workspaceUsers, setWorkspaceUsers] = useState<{ id: string; email: string; name?: string }[]>([])
  const itemsPerPage = 10

  const businessId = currentWorkspace?.id

  // Load leads from Supabase
  useEffect(() => {
    if (businessId) {
      loadLeads()
      loadWorkspaceUsers()
    }
  }, [businessId])

  const loadLeads = async () => {
    if (!businessId) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const transformed: Lead[] = (data || []).map((l: any) => ({
        id: l.id,
        firstName: l.first_name,
        lastName: l.last_name,
        email: l.email || "",
        phone: l.phone || "",
        companyName: l.company_name || "",
        jobTitle: l.job_title || "",
        address: l.address || "",
        source: l.source || "other",
        interest: l.interest || "",
        painPoints: l.pain_points || "",
        budgetMin: l.budget_min,
        budgetMax: l.budget_max,
        temperature: l.temperature || "cold",
        status: l.status || "new",
        leadScore: l.lead_score || 0,
        nextAction: l.next_action || "",
        nextActionDate: l.next_action_date,
        notes: l.notes || "",
        industry: l.industry || "",
        companySize: l.company_size || "",
        location: l.location || "",
        assignedTo: l.assigned_to,
        assignedName: null, // will be populated below
        clientId: l.client_id,
        projectId: l.project_id,
        convertedAt: l.converted_at,
        archivedAt: l.archived_at,
        createdAt: l.created_at,
        updatedAt: l.updated_at,
      }))

      setLeads(transformed)
    } catch (error: any) {
      console.error("Error loading leads:", error)
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorkspaceUsers = async () => {
    if (!businessId) return
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, users:user_id(email, raw_user_meta_data)")
        .eq("business_id", businessId)

      if (error) {
        console.error("Error loading workspace users:", error)
        return
      }

      const users = (data || []).map((ur: any) => ({
        id: ur.user_id,
        email: ur.users?.email || "",
        name:
          ur.users?.raw_user_meta_data?.full_name ||
          ur.users?.raw_user_meta_data?.name ||
          undefined,
      }))

      setWorkspaceUsers(users)
    } catch (error: any) {
      console.error("Error loading workspace users:", error)
    }
  }

  // CRUD: Create or Update lead
  const handleSave = async (formData: LeadFormData) => {
    if (!businessId) throw new Error("No workspace selected")

    const payload = {
      business_id: businessId,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company_name: formData.companyName.trim() || null,
      job_title: formData.jobTitle.trim() || null,
      address: formData.address.trim() || null,
      source: formData.source || "other",
      interest: formData.interest.trim() || null,
      pain_points: formData.painPoints.trim() || null,
      budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
      budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
      temperature: formData.temperature || "cold",
      status: formData.status || "new",
      lead_score: formData.leadScore ? parseInt(formData.leadScore) : 0,
      next_action: formData.nextAction.trim() || null,
      next_action_date: formData.nextActionDate || null,
      notes: formData.notes.trim() || null,
      industry: formData.industry.trim() || null,
      company_size: formData.companySize || null,
      location: formData.location.trim() || null,
      assigned_to: formData.assignedTo && formData.assignedTo !== "unassigned" ? formData.assignedTo : null,
    }

    if (formData.id) {
      const { error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", formData.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from("leads")
        .insert([payload])
      if (error) throw error
    }

    await loadLeads()
    setEditingLead(null)
  }

  // Archive lead
  const archiveLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", leadId)
      if (error) throw error
      await loadLeads()
    } catch (error: any) {
      console.error("Error archiving lead:", error)
      alert("Failed to archive lead: " + error.message)
    }
  }

  // Unarchive lead
  const unarchiveLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ archived_at: null })
        .eq("id", leadId)
      if (error) throw error
      await loadLeads()
    } catch (error: any) {
      console.error("Error unarchiving lead:", error)
      alert("Failed to unarchive lead: " + error.message)
    }
  }

  // Delete lead
  const deleteLead = async () => {
    if (!deleteConfirm) return
    setIsDeletingLead(true)
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", deleteConfirm)
      if (error) throw error
      await loadLeads()
      setDeleteConfirm(null)
    } catch (error: any) {
      console.error("Error deleting lead:", error)
      alert("Failed to delete lead: " + error.message)
    } finally {
      setIsDeletingLead(false)
    }
  }

  // Edit handler
  const handleEdit = (lead: Lead) => {
    setEditingLead({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      jobTitle: lead.jobTitle,
      address: lead.address,
      source: lead.source,
      interest: lead.interest,
      painPoints: lead.painPoints,
      budgetMin: lead.budgetMin?.toString() || "",
      budgetMax: lead.budgetMax?.toString() || "",
      temperature: lead.temperature,
      status: lead.status,
      leadScore: lead.leadScore.toString(),
      nextAction: lead.nextAction,
      nextActionDate: lead.nextActionDate || "",
      notes: lead.notes,
      industry: lead.industry,
      companySize: lead.companySize,
      location: lead.location,
      assignedTo: lead.assignedTo || "",
    })
    setIsFormOpen(true)
  }

  // Filter and search
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase()
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        fullName.includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.companyName.toLowerCase().includes(q)

      const matchesTemp =
        temperatureFilter === "all" || lead.temperature === temperatureFilter
      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter

      return matchesSearch && matchesTemp && matchesStatus
    })
  }, [leads, searchQuery, temperatureFilter, statusFilter])

  const activeLeads = useMemo(
    () => filteredLeads.filter((l) => !l.archivedAt && !l.convertedAt),
    [filteredLeads]
  )
  const convertedLeads = useMemo(
    () => filteredLeads.filter((l) => l.convertedAt && !l.archivedAt),
    [filteredLeads]
  )
  const archivedLeads = useMemo(
    () => filteredLeads.filter((l) => l.archivedAt),
    [filteredLeads]
  )

  const displayLeads =
    activeTab === "active"
      ? activeLeads
      : activeTab === "converted"
        ? convertedLeads
        : archivedLeads

  // Pagination
  const totalPages = Math.ceil(displayLeads.length / itemsPerPage)
  const paginatedLeads = displayLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page on tab/filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, temperatureFilter, statusFilter])

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading leads...</div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Empty State
  if (leads.length === 0 && !searchQuery) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <EmptyState
            icon={Target}
            title="No leads yet"
            description="Add your first lead to start building your sales pipeline"
            action={{
              label: "Add Lead",
              onClick: () => setIsFormOpen(true),
            }}
          />
          <LeadFormModal
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open)
              if (!open) setEditingLead(null)
            }}
            lead={editingLead}
            onSave={handleSave}
            workspaceUsers={workspaceUsers}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Leads</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeLeads.length} active, {convertedLeads.length} converted, {archivedLeads.length} archived
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Temperature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Temps</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "active" | "converted" | "archived")}
        >
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeLeads.length})
            </TabsTrigger>
            <TabsTrigger value="converted">
              Converted ({convertedLeads.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedLeads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {renderTable(paginatedLeads, "active")}
          </TabsContent>
          <TabsContent value="converted" className="mt-4">
            {renderTable(paginatedLeads, "converted")}
          </TabsContent>
          <TabsContent value="archived" className="mt-4">
            {renderTable(paginatedLeads, "archived")}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, displayLeads.length)} of{" "}
              {displayLeads.length} leads
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Lead Form Modal */}
        <LeadFormModal
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)
            if (!open) setEditingLead(null)
          }}
          lead={editingLead}
          onSave={handleSave}
          workspaceUsers={workspaceUsers}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Lead Permanently?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                lead and all associated activity history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeletingLead}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteLead}
                disabled={isDeletingLead}
              >
                {isDeletingLead ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )

  // Render table helper
  function renderTable(leadsList: Lead[], tab: string) {
    if (leadsList.length === 0) {
      return (
        <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || temperatureFilter !== "all" || statusFilter !== "all"
              ? "No leads found matching your filters."
              : tab === "archived"
                ? "No archived leads."
                : tab === "converted"
                  ? "No converted leads yet."
                  : "No active leads."}
          </p>
        </div>
      )
    }

    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Temperature</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Next Action</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsList.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <TableCell className="font-medium">
                  <div>
                    {lead.firstName} {lead.lastName}
                    {lead.email && (
                      <p className="text-xs text-gray-500">{lead.email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {lead.companyName || "---"}
                </TableCell>
                <TableCell className="text-sm">
                  {sourceLabels[lead.source] || lead.source}
                </TableCell>
                <TableCell>
                  <TemperatureBadge temperature={lead.temperature} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-sm font-medium ${
                    lead.leadScore >= 70 ? "text-green-600" :
                    lead.leadScore >= 40 ? "text-yellow-600" :
                    "text-gray-500"
                  }`}>
                    {lead.leadScore}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {lead.nextAction || "---"}
                  {lead.nextActionDate && (
                    <p className="text-xs text-gray-400">
                      {new Date(lead.nextActionDate).toLocaleDateString()}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(lead.createdAt).toLocaleDateString()}
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
                          router.push(`/leads/${lead.id}`)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {tab === "active" && (
                        <>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(lead)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/leads/${lead.id}?convert=true`)
                            }}
                          >
                            <ArrowRightCircle className="w-4 h-4 mr-2" />
                            Convert to Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              archiveLead(lead.id)
                            }}
                            className="text-orange-600"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive Lead
                          </DropdownMenuItem>
                        </>
                      )}
                      {tab === "archived" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              unarchiveLead(lead.id)
                            }}
                            className="text-blue-600"
                          >
                            <ArchiveRestore className="w-4 h-4 mr-2" />
                            Unarchive Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(lead.id)
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
    )
  }
}
