"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  MoreVertical,
  Calendar,
  DollarSign,
  Users as UsersIcon,
  FolderKanban,
  Archive,
  ArchiveRestore,
  Trash2,
  Sparkles,
} from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/client"
import { recordActivity } from "@/lib/activity"
import { toast } from "@/lib/toast"
import { useAuth } from "@/lib/auth/auth-context"
import { StatsCard } from "@/components/admin/stats-card"
import { authFetch } from "@/lib/auth/auth-fetch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ClientSelect } from "@/components/ui/client-select"
import { CityCombobox } from "@/components/ui/city-combobox"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { US_STATES } from "@/lib/us-states"
import { SiteImageGenerationModal, type SiteImageGenStep } from "@/components/project/site-image-generation-modal"

// Types
type ProjectStatus = "lead" | "sale" | "design" | "completed"
type PaymentStatus = "pending" | "partial" | "paid"

interface Project {
  id: string
  title: string
  client: string
  status: ProjectStatus
  paymentStatus: PaymentStatus
  budget: number
  spent: number
  startDate: string
  dueDate: string
  progress: number
  assignees: { name: string; avatar: string }[]
  priority: "low" | "medium" | "high"
  archivedAt?: string | null
}

// No mock data - application starts clean
const allProjects: Project[] = []

function fmtCurrency(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
  return String(v)
}

const statusColors = {
  lead: "bg-[--af-info-bg] text-[--af-info-text] border border-[--af-info-border]",
  sale: "bg-[--af-warning-bg] text-[--af-warning-text] border border-[--af-warning-border]",
  design: "bg-[--af-warning-bg] text-[--af-warning-text] border border-[--af-warning-border]",
  completed: "bg-[--af-success-bg] text-[--af-success-text] border border-[--af-success-border]",
}

const paymentColors = {
  pending: "bg-[--af-danger-bg] text-[--af-danger-text] border border-[--af-danger-border]",
  partial: "bg-[--af-warning-bg] text-[--af-warning-text] border border-[--af-warning-border]",
  paid: "bg-[--af-success-bg] text-[--af-success-text] border border-[--af-success-border]",
}

const priorityColors = {
  low: "bg-[--af-bg-surface-alt] dark:bg-warm-800 text-[--af-text-secondary]",
  medium: "bg-[--af-warning-bg] text-[--af-warning-text]",
  high: "bg-[--af-danger-bg] text-[--af-danger-text]",
}

export default function ProjectsPage() {
  const router = useRouter()
  const { currentWorkspace, workspacesLoaded, user } = useAuth()
  const [projects, setProjects] = useState(allProjects)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all")
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  
  // New project form state
  const [newProject, setNewProject] = useState({
    title: "",
    clientName: "",
    clientId: null as string | null,
    budget: "",
    dueDate: "",
    // Lead-origin details
    source: "",
    interest: "",
    painPoints: "",
    notes: "",
    budgetMin: "",
    temperature: "",
    industry: "",
    companyName: "",
    companySize: "",
    locationAddress: "",
    locationCity: "",
    locationState: "",
    locationZip: "",
    jobTitle: "",
  })
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createFormTab, setCreateFormTab] = useState<"basic" | "details">("basic")
  const [siteImageGenStep, setSiteImageGenStep] = useState<SiteImageGenStep>(null)
  const [siteImageGenError, setSiteImageGenError] = useState<string>("")
  const [siteImageGenUrls, setSiteImageGenUrls] = useState<string[]>([])
  
  // Tab state for Active/Archived
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active")
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isDeletingProject, setIsDeletingProject] = useState(false)

  const businessId = currentWorkspace?.id

  // Load projects from Supabase
  useEffect(() => {
    if (businessId) {
      loadProjects()
    } else if (workspacesLoaded) {
      setIsLoading(false)
    }
  }, [businessId, workspacesLoaded])

  // Listen for project updates from other pages (e.g., Workflow)
  useEffect(() => {
    const handleProjectsUpdated = () => {
      console.log("📢 Projects page received projectsUpdated event, reloading...")
      if (businessId) {
        loadProjects()
      }
    }

    window.addEventListener('projectsUpdated', handleProjectsUpdated)
    
    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdated)
    }
  }, [businessId])

  // Reload data when session is refreshed (e.g. after returning from idle tab)
  useEffect(() => {
    const onSessionRefreshed = () => {
      if (businessId) loadProjects()
    }
    window.addEventListener("session-refreshed", onSessionRefreshed)
    return () => window.removeEventListener("session-refreshed", onSessionRefreshed)
  }, [businessId])

  const loadProjects = async () => {
    if (!businessId) return
    setIsLoading(true)
    setLoadError(null)

    try {
      console.log("🔄 [Projects Page] Loading projects for workspace:", businessId)

      let membersMap: Record<string, { name: string; avatar: string }> = {}
      try {
        const membersRes = await authFetch(`/api/teams/members?businessId=${encodeURIComponent(businessId)}`)
        if (membersRes.ok) {
          const membersList: Array<{ userId: string; firstName: string; lastName: string; email?: string; avatarUrl?: string }> = await membersRes.json()
          const displayName = (m: { firstName: string; lastName: string; email?: string }) =>
            [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || (m.email || "").trim() || "?"
          for (const m of membersList || []) {
            membersMap[m.userId] = { name: displayName(m), avatar: m.avatarUrl || "" }
          }
        }
      } catch {
        /* ignore */
      }

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_assignments(user_id)
        `)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })

      if (error) throw error

      console.log("📦 [Projects Page] Loaded", data?.length || 0, "projects from database")

      const transformedProjects: Project[] = (data || []).map((proj: any) => ({
        id: proj.id,
        title: proj.title,
        client: proj.client_name || "Unknown Client",
        status: proj.status,
        paymentStatus: proj.payment_status,
        budget: proj.budget || 0,
        spent: proj.spent || 0,
        startDate: proj.start_date || new Date().toISOString().split("T")[0],
        dueDate: proj.due_date || new Date().toISOString().split("T")[0],
        progress: Math.round(((proj.spent || 0) / (proj.budget || 1)) * 100),
        assignees: (proj.project_assignments || []).map((assignment: any) => {
          const member = membersMap[assignment.user_id]
          return {
            name: member?.name || assignment.user_id || "?",
            avatar: member?.avatar || "",
          }
        }),
        priority: proj.priority,
        archivedAt: proj.archived_at,
      }))

      console.log("✅ [Projects Page] Transformed projects:", transformedProjects.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status
      })))

      setProjects(transformedProjects)
    } catch (error: any) {
      console.error("❌ [Projects Page] Error loading projects:", error)
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const createProject = async () => {
    if (!currentWorkspace?.id) {
      throw new Error("No workspace selected")
    }

    if (!newProject.title.trim()) {
      throw new Error("Project title is required")
    }

    try {
      console.log("🔄 [Projects Page] Creating project:", newProject)
      
      const projectInsert: any = {
        business_id: currentWorkspace.id,
        title: newProject.title.trim(),
        client_name: newProject.clientName.trim() || null,
        client_id: newProject.clientId || null,
        budget: newProject.budget ? parseFloat(newProject.budget) : null,
        due_date: newProject.dueDate || null,
        status: "lead",
        payment_status: "pending",
        priority: "medium",
        spent: 0,
      }

      // Lead-origin fields
      if (newProject.source) projectInsert.source = newProject.source
      if (newProject.interest) projectInsert.interest = newProject.interest
      if (newProject.painPoints) projectInsert.pain_points = newProject.painPoints
      if (newProject.notes) projectInsert.notes = newProject.notes
      if (newProject.budgetMin) projectInsert.budget_min = parseFloat(newProject.budgetMin)
      if (newProject.temperature) projectInsert.temperature = newProject.temperature
      if (newProject.industry) projectInsert.industry = newProject.industry
      if (newProject.companyName) projectInsert.company_name = newProject.companyName
      if (newProject.companySize) projectInsert.company_size = newProject.companySize
      const locationParts = [newProject.locationAddress, newProject.locationCity, newProject.locationState, newProject.locationZip].filter(Boolean)
      if (locationParts.length) projectInsert.location = locationParts.join(", ")
      if (newProject.jobTitle) projectInsert.job_title = newProject.jobTitle

      const { data, error } = await supabase
        .from("projects")
        .insert([projectInsert])
        .select()
        .single()

      if (error) throw error

      console.log("✅ [Projects Page] Project created successfully:", data)
      if (currentWorkspace?.id && data) {
        recordActivity({
          businessId: currentWorkspace.id,
          userId: user?.id,
          activityType: "project_created",
          entityType: "project",
          entityId: data.id,
          message: `Project "${data.title}" created`,
        }).catch(() => {})
      }
      return data
    } catch (error) {
      console.error("❌ [Projects Page] Error creating project:", error)
      throw error
    }
  }

  const handleCreateProject = async () => {
    setIsCreatingProject(true)
    setCreateError(null)

    try {
      const created = await createProject()
      
      // Reload projects list
      await loadProjects()
      
      // Notify workflow to refresh
      window.dispatchEvent(new Event('projectsUpdated'))
      console.log("📢 [Projects Page] Dispatched projectsUpdated event")

      // Capture address before resetting form
      const locationParts = [newProject.locationAddress, newProject.locationCity, newProject.locationState, newProject.locationZip].filter(Boolean)
      const address = locationParts.join(", ")
      
      // Reset form and close modal
      setNewProject({ title: "", clientName: "", clientId: null, budget: "", dueDate: "", source: "", interest: "", painPoints: "", notes: "", budgetMin: "", temperature: "", industry: "", companyName: "", companySize: "", locationAddress: "", locationCity: "", locationState: "", locationZip: "", jobTitle: "" })
      setIsNewProjectOpen(false)

      // If an address was provided, trigger AI site image generation with animated modal
      if (created?.id && address) {
        setSiteImageGenStep("fetching")
        setSiteImageGenError("")
        setSiteImageGenUrls([])

        // Simulate step progression while API runs (single call, not streaming)
        const enhanceTimer = setTimeout(() => setSiteImageGenStep("enhancing"), 3000)

        fetch("/api/projects/generate-site-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: created.id, address, enhanceMode: "enhanced" }),
        })
          .then(async (res) => {
            clearTimeout(enhanceTimer)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? "Generation failed")
            setSiteImageGenStep("saving")
            // Brief pause on "saving" then show done
            setTimeout(() => {
              const urls = data.files?.map((f: any) => f.url).filter(Boolean) ?? (data.url ? [data.url] : [])
              setSiteImageGenUrls(urls)
              setSiteImageGenStep("done")
              // Auto-dismiss after 2.5s
              setTimeout(() => setSiteImageGenStep(null), 2500)
            }, 800)
          })
          .catch((err) => {
            clearTimeout(enhanceTimer)
            console.error("[Projects Page] Site image generation failed:", err)
            setSiteImageGenError(err.message)
            setSiteImageGenStep("error")
          })
      }
    } catch (error: any) {
      console.error("❌ [Projects Page] Failed to create project:", error)
      setCreateError(error.message)
    } finally {
      setIsCreatingProject(false)
    }
  }

  const archiveProject = async (projectId: string) => {
    try {
      console.log("📦 [Projects Page] Archiving project:", projectId)
      
      const { error } = await supabase
        .from("projects")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", projectId)
        .eq("business_id", currentWorkspace?.id)
      
      if (error) throw error
      
      console.log("✅ [Projects Page] Project archived successfully")
      
      // Reload projects
      await loadProjects()
      
      // Notify workflow
      window.dispatchEvent(new Event('projectsUpdated'))
    } catch (error: any) {
      console.error("❌ [Projects Page] Error archiving project:", error)
      toast.error("Failed to archive project: " + error.message)
    }
  }

  const unarchiveProject = async (projectId: string) => {
    try {
      console.log("📦 [Projects Page] Unarchiving project:", projectId)
      
      const { error } = await supabase
        .from("projects")
        .update({ archived_at: null })
        .eq("id", projectId)
        .eq("business_id", currentWorkspace?.id)
      
      if (error) throw error
      
      console.log("✅ [Projects Page] Project unarchived successfully")
      
      // Reload projects
      await loadProjects()
      
      // Notify workflow
      window.dispatchEvent(new Event('projectsUpdated'))
    } catch (error: any) {
      console.error("❌ [Projects Page] Error unarchiving project:", error)
      toast.error("Failed to unarchive project: " + error.message)
    }
  }

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId)
    setDeleteConfirmOpen(true)
  }

  const deleteProject = async () => {
    if (!projectToDelete) return
    
    setIsDeletingProject(true)
    
    try {
      console.log("🗑️ [Projects Page] Deleting project:", projectToDelete)
      
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete)
        .eq("business_id", currentWorkspace?.id)
      
      if (error) throw error
      
      console.log("✅ [Projects Page] Project deleted successfully")
      
      // Reload projects
      await loadProjects()
      
      // Notify workflow
      window.dispatchEvent(new Event('projectsUpdated'))
      
      // Close dialog
      setDeleteConfirmOpen(false)
      setProjectToDelete(null)
    } catch (error: any) {
      console.error("❌ [Projects Page] Error deleting project:", error)
      toast.error("Failed to delete project: " + error.message)
    } finally {
      setIsDeletingProject(false)
    }
  }

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || project.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Separate active and archived projects
  const activeProjects = filteredProjects.filter(p => !p.archivedAt)
  const archivedProjects = filteredProjects.filter(p => p.archivedAt)
  
  // Use the appropriate list based on active tab
  const displayProjects = activeTab === "active" ? activeProjects : archivedProjects

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-[--af-text-muted]">Loading projects...</div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate stats (only for active projects)
  const stats = {
    total: activeProjects.length,
    active: activeProjects.filter((p) => p.status !== "completed").length,
    totalBudget: activeProjects.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: activeProjects.reduce((sum, p) => sum + p.spent, 0),
  }

  return (
    <AppLayout>
      <div style={{ padding: "var(--af-density-page-padding)", display: "flex", flexDirection: "column", gap: "var(--af-density-section-gap)" }}>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-medium text-[--af-text-muted] uppercase tracking-[2.5px]">Management</span>
            <h1 className="text-[28px] font-display font-bold tracking-tight leading-tight">All Projects</h1>
            <p className="text-[12.5px] text-[--af-text-muted] mt-1">
              {activeProjects.length} active, {archivedProjects.length} archived
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsNewProjectOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Total Projects" value={stats.total} icon={UsersIcon} description={`${stats.active} active`} />
          <StatsCard title="Total Budget" value={`$${fmtCurrency(stats.totalBudget)}`} icon={DollarSign} description="Across all projects" />
          <StatsCard title="Total Spent" value={`$${fmtCurrency(stats.totalSpent)}`} icon={DollarSign} description={`${stats.totalBudget ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0}% of budget`} />
          <StatsCard title="Avg. Progress" value={`${activeProjects.length ? Math.round(activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length) : 0}%`} icon={Calendar} description="Across all projects" />
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[--af-text-muted]" />
            <Input
              placeholder="Search projects or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {filterStatus === "all" ? "All Status" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Projects</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("lead")}>Lead</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("sale")}>Sale</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("design")}>Design</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Projects Table with Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "archived")}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="active">
                Active Projects ({activeProjects.length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({archivedProjects.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="mt-0">
            <div className="border border-[--af-border-default] rounded-card overflow-hidden shadow-af-card">
              <div className="overflow-x-auto">
                <table className="w-full">
              <thead className="bg-[--af-bg-surface-alt]">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Project
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Budget
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Progress
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Due Date
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Team
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--af-border-default] dark:divide-warm-800">
                {displayProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-[--af-bg-surface-alt] cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-display font-semibold tracking-tight">{project.title}</p>
                          <p className="text-xs text-[--af-text-muted] sm:hidden">{project.client}</p>
                          <Badge className={`text-xs mt-1 ${priorityColors[project.priority]}`}>
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <p className="text-sm text-[--af-text-secondary]">{project.client}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${statusColors[project.status]} border`}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-sm">
                        <p className="font-display font-semibold tracking-tight">${fmtCurrency(project.budget)}</p>
                        <p className="text-xs text-[--af-text-muted]">
                          ${fmtCurrency(project.spent)} spent
                        </p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[5px] bg-[--af-bg-surface-alt] rounded-full overflow-hidden min-w-[60px]">
                          <div
                            className="h-full bg-warm-900 dark:bg-[--af-bg-surface] rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[--af-text-muted] min-w-[28px] text-right">
                          {project.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[--af-text-muted] opacity-70" />
                        <span className="text-[13px] text-[--af-text-secondary]">
                          {new Date(project.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4">
                      <div className="flex -space-x-2">
                        {project.assignees.length > 0
                          ? project.assignees.map((assignee, i) => (
                              <Avatar key={i} className="w-7 h-7 border-2 border-[--af-bg-surface]">
                                <AvatarImage src={assignee.avatar} alt="" />
                                <AvatarFallback className="text-[9px] font-bold bg-[--af-brand] text-white">
                                  {assignee.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))
                          : <span className="text-[--af-text-muted] text-xs">&mdash;</span>
                        }
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      <Badge className={`text-xs ${paymentColors[project.paymentStatus]}`}>
                        {project.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/projects/${project.id}`)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            Change Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                            Assign Team
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              archiveProject(project.id)
                            }}
                            className="text-orange-600"
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Archive Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="archived" className="mt-0">
            <div className="border border-[--af-border-default] rounded-card overflow-hidden shadow-af-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[--af-bg-surface-alt]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Project
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Budget
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Progress
                      </th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Due Date
                      </th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Team
                      </th>
                      <th className="hidden sm:table-cell px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[--af-border-default] dark:divide-warm-800">
                    {displayProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="hover:bg-[--af-bg-surface-alt] cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm font-medium">{project.title}</p>
                              <p className="text-xs text-[--af-text-muted] sm:hidden">{project.client}</p>
                              <Badge className={`text-xs mt-1 ${priorityColors[project.priority]}`}>
                                {project.priority}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <p className="text-sm text-[--af-text-secondary]">{project.client}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${statusColors[project.status]} border`}>
                            {project.status}
                          </Badge>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium">${(project.budget / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-[--af-text-muted]">
                              ${(project.spent / 1000).toFixed(0)}k spent
                            </p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[--af-bg-surface-alt] rounded-full overflow-hidden min-w-[60px]">
                              <div
                                className="h-full bg-warm-900 dark:bg-[--af-bg-surface] rounded-full"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-[--af-text-secondary] min-w-[35px]">
                              {project.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4">
                          <p className="text-sm text-[--af-text-secondary]">
                            {new Date(project.dueDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4">
                          <div className="flex -space-x-2">
                            {project.assignees.map((assignee, i) => (
                              <Avatar key={i} className="w-8 h-8 border-2 border-white dark:border-foreground">
                                <AvatarImage src={assignee.avatar} alt="" />
                                <AvatarFallback className="text-xs bg-[--af-bg-surface-alt] dark:bg-warm-800">
                                  {assignee.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <Badge className={`text-xs ${paymentColors[project.paymentStatus]}`}>
                            {project.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/projects/${project.id}`)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  unarchiveProject(project.id)
                                }}
                                className="text-[--af-info-text]"
                              >
                                <ArchiveRestore className="w-4 h-4 mr-2" />
                                Unarchive Project
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(project.id)
                                }}
                                className="text-[--af-danger-text]"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description="Create your first project to get started with ArchaFlow"
            action={{
              label: "New Project",
              onClick: () => setIsNewProjectOpen(true),
            }}
          />
        ) : filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[--af-text-muted]">No projects found matching your search.</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        )}

        {/* New Project Modal */}
      <Dialog 
        open={isNewProjectOpen} 
        onOpenChange={(open) => {
          setIsNewProjectOpen(open)
          if (!open) {
            // Reset form when modal closes
            setNewProject({ title: "", clientName: "", clientId: null, budget: "", dueDate: "", source: "", interest: "", painPoints: "", notes: "", budgetMin: "", temperature: "", industry: "", companyName: "", companySize: "", locationAddress: "", locationCity: "", locationState: "", locationZip: "", jobTitle: "" })
            setCreateError(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {createError && (
              <div className="bg-[--af-danger-bg] border border-[--af-danger-border] rounded-lg p-3 text-sm text-[--af-danger-text] mb-4">
                {createError}
              </div>
            )}
            <Tabs value={createFormTab} onValueChange={(v) => setCreateFormTab(v as "basic" | "details")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Title *</label>
                  <Input 
                    type="text" 
                    placeholder="Enter project name"
                    value={newProject.title}
                    onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <ClientSelect
                    value={{ clientId: newProject.clientId, displayName: newProject.clientName }}
                    onChange={({ clientId, displayName }) =>
                      setNewProject(prev => ({ ...prev, clientId, clientName: displayName }))
                    }
                    placeholder="Search for a client..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget</label>
                    <Input 
                      type="number" 
                      placeholder="450000"
                      value={newProject.budget}
                      onChange={(e) => setNewProject(prev => ({ ...prev, budget: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input 
                      type="date"
                      value={newProject.dueDate}
                      onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lead Source</label>
                  <Select
                    value={newProject.source}
                    onValueChange={(value) => setNewProject(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website_form">Website Form</SelectItem>
                      <SelectItem value="email_campaign">Email Campaign</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="ad">Advertisement</SelectItem>
                      <SelectItem value="trade_show">Trade Show</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interest / Service</label>
                  <Input
                    placeholder="What are they interested in?"
                    value={newProject.interest}
                    onChange={(e) => setNewProject(prev => ({ ...prev, interest: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <div className="flex gap-2">
                    {(["cold", "warm", "hot"] as const).map((temp) => (
                      <button
                        key={temp}
                        type="button"
                        onClick={() => setNewProject(prev => ({ ...prev, temperature: prev.temperature === temp ? "" : temp }))}
                        className={`flex-1 py-2 px-4 rounded-card border text-sm font-medium capitalize transition-colors ${
                          newProject.temperature === temp
                            ? temp === "cold"
                              ? "border-[--af-info-border] bg-[--af-info-bg] text-[--af-info-text]"
                              : temp === "warm"
                                ? "border-[--af-warning-border] bg-[--af-warning-bg] text-[--af-warning-text]"
                                : "border-[--af-danger-border] bg-[--af-danger-bg] text-[--af-danger-text]"
                            : "border-[--af-border-default] text-[--af-text-muted]"
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pain Points</label>
                  <Textarea
                    placeholder="What challenges is the client facing?"
                    value={newProject.painPoints}
                    onChange={(e) => setNewProject(prev => ({ ...prev, painPoints: e.target.value }))}
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input
                      placeholder="Acme Corp"
                      value={newProject.companyName}
                      onChange={(e) => setNewProject(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <Input
                      placeholder="Real Estate, Construction..."
                      value={newProject.industry}
                      onChange={(e) => setNewProject(prev => ({ ...prev, industry: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    placeholder="123 Main St"
                    value={newProject.locationAddress}
                    onChange={(e) => setNewProject(prev => ({ ...prev, locationAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <CityCombobox
                      value={newProject.locationCity}
                      onChange={(v) => setNewProject(prev => ({ ...prev, locationCity: v }))}
                      placeholder="Search city..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <SearchableSelect
                      options={US_STATES}
                      value={newProject.locationState}
                      onValueChange={(v) => setNewProject(prev => ({ ...prev, locationState: v }))}
                      placeholder="Select state"
                      searchPlaceholder="Search states..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zipcode</label>
                    <Input
                      placeholder="12345"
                      value={newProject.locationZip}
                      onChange={(e) => setNewProject(prev => ({ ...prev, locationZip: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Size</label>
                    <Select
                      value={newProject.companySize}
                      onValueChange={(value) => setNewProject(prev => ({ ...prev, companySize: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1,000 employees</SelectItem>
                        <SelectItem value="1001+">1,001+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* AI Site Image hint — shown when any address field is filled */}
                {(newProject.locationAddress || newProject.locationCity || newProject.locationState) && (
                  <div className="flex items-start gap-2 rounded-lg border border-[--af-info-border] bg-[--af-info-bg] px-3 py-2.5 text-xs text-[--af-info-text]">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      An AI-enhanced site image will be automatically generated from this address and added to project resources after creation.
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="General notes about this project..."
                    value={newProject.notes}
                    onChange={(e) => setNewProject(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsNewProjectOpen(false)}
              disabled={isCreatingProject}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={isCreatingProject}
            >
              {isCreatingProject ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* Site Image Generation Modal */}
        <SiteImageGenerationModal
          step={siteImageGenStep}
          errorMessage={siteImageGenError}
          generatedImageUrls={siteImageGenUrls}
          onDismiss={() => setSiteImageGenStep(null)}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project Permanently?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the project and all associated data including tasks, files, notes, and time entries.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeletingProject}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={deleteProject}
                disabled={isDeletingProject}
              >
                {isDeletingProject ? "Deleting..." : "Delete Permanently"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
