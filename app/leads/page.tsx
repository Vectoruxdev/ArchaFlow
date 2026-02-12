"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { LeadFormModal, type LeadFormData } from "@/components/leads/lead-form-modal"
import { authFetch } from "@/lib/auth/auth-fetch"
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
  Calendar,
  Activity,
  LayoutList,
} from "lucide-react"

// Types
interface Lead {
  id: string
  uniqueCustomerIdentifier: string
  leadTypeId: string | null
  leadTypeName: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  address: string
  city: string
  state: string
  source: string
  interest: string
  painPoints: string
  budget: number | null
  squareFootage: number | null
  costPerSqft: number | null
  discountType: string | null
  discountValue: number | null
  temperature: string
  status: string
  leadScore: number
  nextAction: string
  nextActionDate: string | null
  notes: string
  assignedTo: string | null
  assignedName: string | null
  clientId: string | null
  projectId: string | null
  convertedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

type DatePreset = "today" | "7d" | "14d" | "30d" | "365d" | "custom"

interface LeadsStats {
  newLeadsCount: number
  followUpsCount: number
}

function getDateRange(
  preset: DatePreset,
  customStart?: string,
  customEnd?: string
): { start: string; end: string } {
  const now = new Date()
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (preset === "custom" && customStart && customEnd) {
    const start = new Date(customStart)
    const end = new Date(customEnd)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { start: start.toISOString(), end: end.toISOString() }
  }

  let start: Date
  switch (preset) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      break
    case "7d":
      start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      break
    case "14d":
      start = new Date(now)
      start.setDate(start.getDate() - 13)
      start.setHours(0, 0, 0, 0)
      break
    case "30d":
      start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      break
    case "365d":
      start = new Date(now)
      start.setDate(start.getDate() - 364)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  }
  return { start: start.toISOString(), end: endOfToday.toISOString() }
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
  const [lifecycleFilter, setLifecycleFilter] = useState<"all" | "active" | "converted" | "archived">("all")
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<LeadFormData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeletingLead, setIsDeletingLead] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [workspaceUsers, setWorkspaceUsers] = useState<{ id: string; email: string; name?: string }[]>([])
  const [leadTypes, setLeadTypes] = useState<{ id: string; label: string }[]>([])
  const [salesAgentsForFilter, setSalesAgentsForFilter] = useState<{ id: string; email: string; name?: string }[]>([])
  const [datePreset, setDatePreset] = useState<DatePreset>("7d")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [leadsStats, setLeadsStats] = useState<LeadsStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const itemsPerPage = 10

  const businessId = currentWorkspace?.id

  // Load leads from Supabase
  useEffect(() => {
    if (businessId) {
      loadLeads()
      loadWorkspaceUsers()
      loadLeadTypes()
    }
  }, [businessId])

  const loadLeads = async () => {
    if (!businessId) return
    setIsLoading(true)
    setLoadError(null)

    try {
      const [{ data: leadsData, error: leadsError }, { data: typesData }] = await Promise.all([
        supabase.from("leads").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
        supabase.from("lead_types").select("id, label").eq("business_id", businessId).order("order_index", { ascending: true }),
      ])

      if (leadsError) throw leadsError

      const leadTypeMap = Object.fromEntries((typesData || []).map((lt: any) => [lt.id, lt.label]))

      const transformed: Lead[] = (leadsData || []).map((l: any) => ({
        id: l.id,
        uniqueCustomerIdentifier: l.unique_customer_identifier || "",
        leadTypeId: l.lead_type_id || null,
        leadTypeName: l.lead_type_id ? leadTypeMap[l.lead_type_id] || null : null,
        firstName: l.first_name,
        lastName: l.last_name,
        email: l.email || "",
        phone: l.phone || "",
        companyName: l.company_name || "",
        address: l.address || "",
        city: l.city || "",
        state: l.state || "",
        source: l.source || "other",
        interest: l.interest || "",
        painPoints: l.pain_points || "",
        budget: l.budget ?? null,
        squareFootage: l.square_footage ?? null,
        costPerSqft: l.cost_per_sqft ?? null,
        discountType: l.discount_type ?? null,
        discountValue: l.discount_value ?? null,
        temperature: l.temperature || "cold",
        status: l.status || "new",
        leadScore: l.lead_score || 0,
        nextAction: l.next_action || "",
        nextActionDate: l.next_action_date,
        notes: l.notes || "",
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
      const res = await authFetch(
        `/api/teams/members?businessId=${encodeURIComponent(businessId)}`
      )
      if (!res.ok) {
        console.error("Error loading workspace users:", res.status)
        setWorkspaceUsers([])
        return
      }
      const members = await res.json()
      const toUser = (m: any) => ({
        id: m.userId,
        email: m.email || "",
        name: [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || m.email || undefined,
      })
      const allMapped = (Array.isArray(members) ? members : []).map(toUser)
      const salesAgents = (Array.isArray(members) ? members : [])
        .filter((m: any) => (m.position || "").trim().toLowerCase() === "sales agent")
        .map(toUser)
      const dedupe = (arr: { id: string; email: string; name?: string }[]) => {
        const seen = new Set<string>()
        return arr.filter((u) => {
          if (seen.has(u.id)) return false
          seen.add(u.id)
          return true
        })
      }
      setSalesAgentsForFilter(dedupe(salesAgents))
      setWorkspaceUsers(dedupe(salesAgents.length > 0 ? salesAgents : allMapped))
    } catch (error: any) {
      console.error("Error loading workspace users:", error)
      setWorkspaceUsers([])
    }
  }

  const loadLeadTypes = async () => {
    if (!businessId) return
    try {
      const { data, error } = await supabase
        .from("lead_types")
        .select("id, label")
        .eq("business_id", businessId)
        .order("order_index", { ascending: true })

      if (error) throw error
      setLeadTypes((data || []).map((lt: any) => ({ id: lt.id, label: lt.label })))
    } catch (error: any) {
      console.error("Error loading lead types:", error)
      setLeadTypes([])
    }
  }

  const loadLeadsStats = async () => {
    if (!businessId) return
    const { start, end } = getDateRange(datePreset, customStart, customEnd)
    if (datePreset === "custom" && (!customStart || !customEnd)) {
      setLeadsStats(null)
      return
    }
    setStatsLoading(true)
    try {
      const [{ data: leadsData, error: leadsError }, { data: leadIdsData }] = await Promise.all([
        supabase
          .from("leads")
          .select("id")
          .eq("business_id", businessId)
          .gte("created_at", start)
          .lte("created_at", end),
        supabase
          .from("leads")
          .select("id")
          .eq("business_id", businessId),
      ])
      if (leadsError) throw leadsError

      const newLeadsCount = leadsData?.length ?? 0

      const leadIds = (leadIdsData || []).map((l: { id: string }) => l.id)
      let followUpsCount = 0
      if (leadIds.length > 0) {
        const { count, error: actsError } = await supabase
          .from("lead_activities")
          .select("id", { count: "exact", head: true })
          .in("lead_id", leadIds)
          .gte("created_at", start)
          .lte("created_at", end)
        if (!actsError) followUpsCount = count ?? 0
      }

      setLeadsStats({
        newLeadsCount,
        followUpsCount,
      })
    } catch (error: any) {
      console.error("Error loading leads stats:", error)
      setLeadsStats(null)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (businessId) loadLeadsStats()
  }, [businessId, datePreset, customStart, customEnd])

  // CRUD: Create or Update lead
  const handleSave = async (formData: LeadFormData) => {
    if (!businessId) throw new Error("No workspace selected")

    const payload = {
      business_id: businessId,
      unique_customer_identifier: formData.uniqueCustomerIdentifier.trim() || null,
      lead_type_id: formData.leadTypeId || null,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company_name: formData.companyName.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state || null,
      source: formData.source || "other",
      interest: formData.interest.trim() || null,
      pain_points: formData.painPoints.trim() || null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      square_footage: formData.squareFootage ? parseFloat(formData.squareFootage) : null,
      cost_per_sqft: formData.costPerSqft ? parseFloat(formData.costPerSqft) : null,
      discount_type: formData.discountType || null,
      discount_value: formData.discountValue ? parseFloat(formData.discountValue) : null,
      temperature: formData.temperature || "cold",
      status: formData.status || "new",
      lead_score: formData.leadScore ? parseInt(formData.leadScore) : 0,
      next_action: formData.nextAction.trim() || null,
      next_action_date: formData.nextActionDate || null,
      notes: formData.notes.trim() || null,
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
    loadLeadsStats()
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
      uniqueCustomerIdentifier: lead.uniqueCustomerIdentifier,
      leadTypeId: lead.leadTypeId || "",
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      source: lead.source,
      interest: lead.interest,
      painPoints: lead.painPoints,
      budget: lead.budget?.toString() || "",
      squareFootage: lead.squareFootage?.toString() || "",
      costPerSqft: lead.costPerSqft?.toString() || "",
      discountType: lead.discountType || "",
      discountValue: lead.discountValue?.toString() || "",
      temperature: lead.temperature,
      status: lead.status,
      leadScore: lead.leadScore.toString(),
      nextAction: lead.nextAction,
      nextActionDate: lead.nextActionDate || "",
      notes: lead.notes,
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

      const matchesAssigned =
        assignedToFilter === "all" ||
        (assignedToFilter === "unassigned" ? !lead.assignedTo : lead.assignedTo === assignedToFilter)

      return matchesSearch && matchesTemp && matchesStatus && matchesAssigned
    })
  }, [leads, searchQuery, temperatureFilter, statusFilter, assignedToFilter])

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

  const displayLeads = useMemo(() => {
    if (lifecycleFilter === "active") return activeLeads
    if (lifecycleFilter === "converted") return convertedLeads
    if (lifecycleFilter === "archived") return archivedLeads
    return filteredLeads
  }, [filteredLeads, activeLeads, convertedLeads, archivedLeads, lifecycleFilter])

  // Pagination
  const totalPages = Math.ceil(displayLeads.length / itemsPerPage)
  const paginatedLeads = displayLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [lifecycleFilter, searchQuery, temperatureFilter, statusFilter, assignedToFilter])

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
            leadTypes={leadTypes}
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

        {/* Date filter and stats */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Date range:</span>
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 2 weeks</SelectItem>
                <SelectItem value="30d">Last month</SelectItem>
                <SelectItem value="365d">Last year</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {datePreset === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    {customStart && customEnd ? `${customStart} – ${customEnd}` : "Select dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Start</label>
                      <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">End</label>
                      <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {statsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading stats...</div>
          ) : leadsStats ? (
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <LayoutList className="w-4 h-4" />
                  <span className="text-sm font-medium">Total leads</span>
                </div>
                <p className="text-2xl font-semibold">{leads.length}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">New leads</span>
                </div>
                <p className="text-2xl font-semibold">{leadsStats.newLeadsCount}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">Follow-ups</span>
                </div>
                <p className="text-2xl font-semibold">{leadsStats.followUpsCount}</p>
              </div>
            </div>
          ) : datePreset === "custom" && (!customStart || !customEnd) ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Select a custom date range to view stats</div>
          ) : null}
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
          <Select value={lifecycleFilter} onValueChange={(v) => setLifecycleFilter(v as "all" | "active" | "converted" | "archived")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Lifecycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lifecycle</SelectItem>
              <SelectItem value="active">Active ({activeLeads.length})</SelectItem>
              <SelectItem value="converted">Converted ({convertedLeads.length})</SelectItem>
              <SelectItem value="archived">Archived ({archivedLeads.length})</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sales Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {salesAgentsForFilter.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name || agent.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads Table */}
        {renderTable(paginatedLeads)}

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
          leadTypes={leadTypes}
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
  function renderTable(leadsList: Lead[]) {
    if (leadsList.length === 0) {
      return (
        <div className="text-center py-12 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || temperatureFilter !== "all" || statusFilter !== "all" || lifecycleFilter !== "all" || assignedToFilter !== "all"
              ? "No leads found matching your filters."
              : "No leads yet."}
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
                      {!lead.archivedAt && !lead.convertedAt && (
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
                      {lead.archivedAt && (
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
