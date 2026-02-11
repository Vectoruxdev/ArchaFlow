"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import {
  Plus,
  StickyNote,
  Paperclip,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Filter,
  X,
  Clock,
  Play,
  Pause,
  Save,
  Upload,
  Trash2,
  File,
  FileText,
  LayoutGrid,
  List,
  GripVertical,
  Copy,
  Pencil,
  Users,
  Archive,
  MoreVertical,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProjectDetailContent } from "@/components/project/project-detail-content"
import { AssignTeamModal } from "@/components/project/assign-team-modal"
import { EmptyState } from "@/components/ui/empty-state"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/auth/auth-fetch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase/client"
import { ClientSelect } from "@/components/ui/client-select"

// Types
type ProjectStatus = string

interface Column {
  id: ProjectStatus
  label: string
  colorKey?: "lead" | "sale" | "design" | "completed" | "neutral"
  dbId?: string  // Database UUID from project_statuses table
}

interface TimeEntry {
  id: string
  userId: string
  userName: string
  startTime: string
  endTime?: string
  duration: number // in minutes
  notes: string
  date: string
  billable: boolean
  isActive: boolean // true if timer is currently running
}

interface ProjectFile {
  id: string
  name: string
  size: number
  type: string
  uploadedBy: string
  uploadedAt: string
  url: string
}

interface Project {
  id: string
  title: string
  client: string
  clientId?: string | null
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  dueDate: string
  startDate?: string
  expectedCompletion?: string
  budget?: string
  description?: string
  status: ProjectStatus
  assignees: { name: string; avatar: string }[]
  primaryOwner?: { name: string; avatar?: string }
  secondaryOwner?: { name: string; avatar?: string }
  paymentStatus: "pending" | "partial" | "paid"
  priority: "low" | "medium" | "high"
  timeEntries: TimeEntry[]
  files: ProjectFile[]
  businessId?: string
  primaryOwnerId?: string | null
  secondaryOwnerId?: string | null
}

interface Activity {
  id: string
  type: "note" | "payment" | "file" | "status"
  message: string
  time: string
  user: string
}

// No mock data - application starts clean
const initialProjects: Project[] = []
const activities: Activity[] = []

const defaultColumns: Column[] = [
  { id: "lead", label: "Lead", colorKey: "lead" },
  { id: "sale", label: "Sale", colorKey: "sale" },
  { id: "design", label: "Design", colorKey: "design" },
  { id: "completed", label: "Completed", colorKey: "completed" },
]

const statusColors = {
  lead: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  sale: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  design: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  neutral: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

const paymentColors = {
  pending: "bg-red-500/10 text-red-600 dark:text-red-400",
  partial: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentWorkspace, workspaces, switchWorkspace, loading: authLoading, workspacesLoading, workspacesLoaded } = useAuth()
  const [projects, setProjects] = useState(initialProjects)
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  
  // New project form state
  const [newProject, setNewProject] = useState({
    // Basic info
    title: "",
    status: "lead",
    priority: "medium",
    paymentStatus: "pending",
    // Client details
    client: "",
    clientId: null as string | null,
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    // Timeline & Budget
    startDate: "",
    dueDate: "",
    expectedCompletion: "",
    budget: "",
    description: "",
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
    location: "",
    jobTitle: "",
  })
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [initialTasks, setInitialTasks] = useState<{title: string}[]>([])
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createModalTab, setCreateModalTab] = useState<"basic" | "client" | "details" | "timeline" | "team">("basic")
  const [workspaceUsers, setWorkspaceUsers] = useState<Array<{id: string, email: string, name?: string}>>([])
  const [loadingWorkspaceUsers, setLoadingWorkspaceUsers] = useState(false)

  // Column state
  const [columns, setColumns] = useState<Column[]>(defaultColumns)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [columnDraft, setColumnDraft] = useState("")
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnLabel, setNewColumnLabel] = useState("")
  const boardScrollRef = useRef<HTMLDivElement | null>(null)
  
  // Workspace members for team filter (loaded with projects)
  const [workspaceMembersForFilter, setWorkspaceMembersForFilter] = useState<
    Array<{ userId: string; firstName: string; lastName: string; email: string }>
  >([])

  // Filter state
  const [filters, setFilters] = useState({
    teamMemberIds: [] as string[],
    dateRange: "all",
    paymentStatus: "all",
    priority: "all",
    statuses: defaultColumns.map((column) => column.id) as ProjectStatus[],
  })

  // Time tracking state
  const [timeTrackingModal, setTimeTrackingModal] = useState<{
    isOpen: boolean
    projectId: string | null
  }>({ isOpen: false, projectId: null })
  
  const [activeTimer, setActiveTimer] = useState<{
    projectId: string
    startTime: Date
    elapsed: number
  } | null>(null)
  
  const [timerTab, setTimerTab] = useState<"timer" | "manual">("timer")
  const [timerNotes, setTimerNotes] = useState("")
  const [timerBillable, setTimerBillable] = useState(true)
  const [timerDate, setTimerDate] = useState(new Date().toISOString().split("T")[0])
  
  const [manualHours, setManualHours] = useState("")
  const [manualMinutes, setManualMinutes] = useState("")
  const [manualNotes, setManualNotes] = useState("")
  const [manualBillable, setManualBillable] = useState(true)
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0])
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // File upload state
  const [fileUploadModal, setFileUploadModal] = useState<{
    isOpen: boolean
    projectId: string | null
  }>({ isOpen: false, projectId: null })
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<"board" | "list">("board")

  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Project detail modal state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isProjectDetailModalOpen, setIsProjectDetailModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  // Get workspace ID from auth context
  const businessId = currentWorkspace?.id
  
  // Combined loading state: wait for both auth and workspaces
  const isAuthReady = !authLoading && workspacesLoaded
  
  // If no workspace is selected, try to get the first one
  useEffect(() => {
    if (isAuthReady && !currentWorkspace && workspaces.length > 0 && !isLoading) {
      console.log("No workspace selected, switching to first available:", workspaces[0])
      switchWorkspace(workspaces[0].id)
    }
  }, [isAuthReady, currentWorkspace, workspaces, isLoading])

  // Load projects and columns from Supabase
  useEffect(() => {
    if (isAuthReady && businessId) {
      console.log("🔄 Auth ready and workspace available, loading projects...")
      loadProjectsAndColumns()
      loadWorkspaceUsers()
    } else if (isAuthReady && !businessId) {
      // Auth is ready but no workspace — stop showing the loading spinner
      setIsLoading(false)
    }
  }, [isAuthReady, businessId])

  // Reload data when session is refreshed (e.g. after returning from idle tab)
  useEffect(() => {
    const onSessionRefreshed = () => {
      if (businessId) {
        loadProjectsAndColumns()
        loadWorkspaceUsers()
      }
    }
    window.addEventListener("session-refreshed", onSessionRefreshed)
    return () => window.removeEventListener("session-refreshed", onSessionRefreshed)
  }, [businessId])

  const loadProjectsAndColumns = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)

      // Check if Supabase is configured FIRST
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured, showing empty state")
        setProjects([])
        setIsLoading(false)
        return
      }

      // Wait for auth to be ready before checking workspace
      if (!isAuthReady) {
        console.log("⏳ Waiting for authentication and workspaces to load...")
        setIsLoading(false)
        return
      }

      // Check if user has a workspace
      if (!businessId) {
        console.log("⚠️ No workspace ID available after auth ready")
        setLoadError("No workspace selected. Please select a workspace from the sidebar.")
        setIsLoading(false)
        return
      }

      console.log("Loading data for workspace:", businessId)

      try {
        // Load project statuses (columns)
        console.log("🔍 Loading project statuses for workspace:", businessId)
        const { data: statusData, error: statusError } = await supabase
          .from("project_statuses")
          .select("*")
          .eq("business_id", businessId)
          .order("order_index")

        let columnsToUse: Column[] = defaultColumns
        
        if (statusError) {
          console.error("❌ Error loading project statuses:", statusError)
          // Don't throw - just use default columns
          columnsToUse = defaultColumns
        } else if (statusData && statusData.length > 0) {
          console.log("✓ Loaded", statusData.length, "project statuses from database")
          columnsToUse = statusData.map((status: any) => ({
            id: status.label.toLowerCase(),
            label: status.label,
            colorKey: status.color_key,
            dbId: status.id,  // Database UUID for updates
          }))
        } else {
          // No statuses found, use defaults
          console.log("⚠️ No project statuses found, using defaults")
          columnsToUse = defaultColumns
        }
        
        setColumns(columnsToUse)
        setFilters((prev) => ({
          ...prev,
          statuses: columnsToUse.map((col) => col.id),
        }))

        // Load projects with their relationships (exclude archived)
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select(`
            *,
            project_assignments(user_id),
            project_time_entries(*),
            project_files(*)
          `)
          .eq("business_id", businessId)
          .is("archived_at", null)
          .order("created_at", { ascending: false })

        if (projectsError) {
          console.error("Error loading projects:", projectsError)
          throw projectsError
        }

        console.log("📦 Raw projects from database:", projectsData?.length || 0)

        // Resolve primary/secondary owners from workspace members
        let membersMap: Record<string, { name: string; avatar?: string }> = {}
        try {
          const membersRes = await authFetch(`/api/teams/members?businessId=${encodeURIComponent(businessId)}`)
          if (membersRes.ok) {
            const membersList: Array<{ userId: string; firstName: string; lastName: string; email?: string; avatarUrl?: string }> = await membersRes.json()
            const displayName = (m: { firstName: string; lastName: string; email?: string }) =>
              [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || (m.email || "").trim() || "?"
            for (const m of membersList || []) {
              membersMap[m.userId] = { name: displayName(m), avatar: m.avatarUrl }
            }
            setWorkspaceMembersForFilter(
              (membersList || []).map((m) => ({
                userId: m.userId,
                firstName: m.firstName || "",
                lastName: m.lastName || "",
                email: m.email || "",
              }))
            )
          } else {
            setWorkspaceMembersForFilter([])
          }
        } catch (_) {
          setWorkspaceMembersForFilter([])
        }

        // Transform database projects to app format
        const transformedProjects: Project[] = (projectsData || []).map((proj: any) => {
          const primaryOwner = proj.primary_owner_id && membersMap[proj.primary_owner_id]
            ? { name: membersMap[proj.primary_owner_id].name, avatar: membersMap[proj.primary_owner_id].avatar }
            : undefined
          const secondaryOwner = proj.secondary_owner_id && membersMap[proj.secondary_owner_id]
            ? { name: membersMap[proj.secondary_owner_id].name, avatar: membersMap[proj.secondary_owner_id].avatar }
            : undefined
          return {
          id: proj.id,
          title: proj.title,
          client: proj.client_name || "Unknown Client",
          clientEmail: proj.client_email,
          clientPhone: proj.client_phone,
          clientAddress: proj.client_address,
          dueDate: proj.due_date || new Date().toISOString().split("T")[0],
          startDate: proj.start_date,
          expectedCompletion: proj.expected_completion,
          budget: proj.budget?.toString(),
          description: proj.description,
          status: proj.status,
          assignees: (proj.project_assignments || []).map((assignment: any) => ({
            name: assignment.user_id, // TODO: Fetch actual user names
            avatar: "",
          })),
          primaryOwner,
          secondaryOwner,
          businessId: proj.business_id,
          primaryOwnerId: proj.primary_owner_id ?? null,
          secondaryOwnerId: proj.secondary_owner_id ?? null,
          paymentStatus: proj.payment_status,
          priority: proj.priority,
          timeEntries: (proj.project_time_entries || []).map((entry: any) => ({
            id: entry.id,
            userId: entry.user_id,
            userName: entry.user_id, // TODO: Fetch actual user names
            startTime: entry.start_time,
            endTime: entry.end_time,
            duration: entry.duration,
            notes: entry.notes || "",
            date: entry.date,
            billable: entry.billable,
            isActive: entry.is_active,
          })),
          files: (proj.project_files || []).map((file: any) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedBy: file.uploaded_by, // TODO: Fetch actual user names
            uploadedAt: file.uploaded_at,
            url: file.url,
          })),
          }
        })

        console.log("=" .repeat(60))
        console.log("📊 PROJECT LOADING SUMMARY")
        console.log("=" .repeat(60))
        console.log("1️⃣ Columns loaded:", columnsToUse.map(c => c.id))
        console.log("2️⃣ Filter statuses being set:", columnsToUse.map((col) => col.id))
        console.log("3️⃣ Projects loaded from DB:", projectsData?.length || 0)
        console.log("4️⃣ Transformed projects:", transformedProjects.length)
        console.log("5️⃣ Project details:", transformedProjects.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          client: p.client
        })))
        console.log("6️⃣ Setting projects state...")
        console.log("=" .repeat(60))

        setProjects(transformedProjects)
      } catch (innerError: any) {
        console.error("Error in data loading:", innerError)
        setLoadError(innerError.message || "Failed to load data")
        setProjects([])
      }
    } catch (error: any) {
      console.error("Error loading projects:", error)
      setLoadError(error.message || "An unexpected error occurred")
      // Set empty projects on error
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorkspaceUsers = async () => {
    if (!isSupabaseConfigured() || !businessId) return
    
    try {
      setLoadingWorkspaceUsers(true)
      
      // Get user IDs from user_roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("business_id", businessId)
      
      if (rolesError) {
        console.error("Error loading workspace user roles:", rolesError)
        return
      }
      
      if (!roles || roles.length === 0) {
        setWorkspaceUsers([])
        return
      }
      
      // Get user details from auth.users directly using admin API
      // Since we can't join to auth.users, we'll use the user IDs as display names for now
      const users = roles.map((role: any) => ({
        id: role.user_id,
        email: role.user_id, // Will show user ID for now
        name: role.user_id.substring(0, 8), // Use first 8 chars of UUID as name
      }))
      
      setWorkspaceUsers(users)
    } catch (error: any) {
      console.error("Error loading workspace users:", error)
    } finally {
      setLoadingWorkspaceUsers(false)
    }
  }

  const createProject = async (projectData: Partial<Project>) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured")
    }
    
    try {
      // Prepare project data
      const projectInsert: any = {
        business_id: businessId,
        title: projectData.title,
        status: projectData.status || "lead",
        payment_status: projectData.paymentStatus || "pending",
        priority: projectData.priority || "medium",
      }

      // Add optional fields if they have values
      if (projectData.client) projectInsert.client_name = projectData.client
      if (projectData.clientId) projectInsert.client_id = projectData.clientId
      if (projectData.clientEmail) projectInsert.client_email = projectData.clientEmail
      if (projectData.clientPhone) projectInsert.client_phone = projectData.clientPhone
      if (projectData.clientAddress) projectInsert.client_address = projectData.clientAddress
      if (projectData.startDate) projectInsert.start_date = projectData.startDate
      if (projectData.dueDate) projectInsert.due_date = projectData.dueDate
      if (projectData.expectedCompletion) projectInsert.expected_completion = projectData.expectedCompletion
      if (projectData.budget) projectInsert.budget = parseFloat(projectData.budget)
      if (projectData.description) projectInsert.description = projectData.description
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
      if (newProject.location) projectInsert.location = newProject.location
      if (newProject.jobTitle) projectInsert.job_title = newProject.jobTitle

      const { data, error } = await supabase
        .from("projects")
        .insert([projectInsert])
        .select()
        .single()

      if (error) throw error

      // Handle team member assignments if any
      if (selectedTeamMembers.length > 0) {
        const assignments = selectedTeamMembers.map(userId => ({
          project_id: data.id,
          user_id: userId,
        }))
        
        const { error: assignError } = await supabase
          .from("project_assignments")
          .insert(assignments)
        
        if (assignError) {
          console.error("Error assigning team members:", assignError)
          // Don't throw - project was created successfully
        }
      }

      // Handle initial tasks if any
      if (initialTasks.length > 0) {
        const validTasks = initialTasks.filter(task => task.title.trim())
        if (validTasks.length > 0) {
          const tasksInsert = validTasks.map((task, index) => ({
            project_id: data.id,
            title: task.title.trim(),
            order_index: index,
          }))
          
          const { error: tasksError } = await supabase
            .from("project_tasks")
            .insert(tasksInsert)
          
          if (tasksError) {
            console.error("Error creating initial tasks:", tasksError)
            // Don't throw - project was created successfully
          }
        }
      }

      // Reload projects to show the new one
      console.log("🔄 Reloading projects after creation...")
      await loadProjectsAndColumns()
      console.log("✓ Projects reloaded")
      
      // Notify other pages that projects have been updated
      window.dispatchEvent(new Event('projectsUpdated'))
      console.log("📢 Dispatched projectsUpdated event")
      
      return data
    } catch (error: any) {
      console.error("Error creating project:", error)
      throw error
    }
  }

  const handleCreateProject = async () => {
    try {
      setIsCreatingProject(true)
      setCreateError(null)
      
      // Validation
      if (!newProject.title.trim()) {
        setCreateError("Project title is required")
        return
      }
      
      console.log("🚀 Creating project:", newProject)
      
      // Create project and wait for reload to complete
      await createProject(newProject as any)
      
      console.log("✅ Project created and reloaded successfully")
      
      // Reset form and close modal
      setNewProject({
        title: "",
        status: "lead",
        priority: "medium",
        paymentStatus: "pending",
        client: "",
        clientId: null,
        clientEmail: "",
        clientPhone: "",
        clientAddress: "",
        startDate: "",
        dueDate: "",
        expectedCompletion: "",
        budget: "",
        description: "",
        source: "",
        interest: "",
        painPoints: "",
        notes: "",
        budgetMin: "",
        temperature: "",
        industry: "",
        companyName: "",
        companySize: "",
        location: "",
        jobTitle: "",
      })
      setSelectedTeamMembers([])
      setInitialTasks([])
      setCreateModalTab("basic")
      setIsNewProjectOpen(false)
    } catch (error: any) {
      console.error("❌ Error creating project:", error)
      setCreateError(error.message || "Failed to create project")
    } finally {
      setIsCreatingProject(false)
    }
  }

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", projectId)

      if (error) throw error

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      )
    } catch (error: any) {
      console.error("Error updating project status:", error)
      throw error
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId)

      if (error) throw error

      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    } catch (error: any) {
      console.error("Error deleting project:", error)
      throw error
    }
  }

  const archiveProjectFromModal = async (projectId: string, projectBusinessId?: string) => {
    const bid = projectBusinessId || currentWorkspace?.id
    if (!bid) return

    try {
      const { error } = await supabase
        .from("projects")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", projectId)
        .eq("business_id", bid)

      if (error) throw error

      window.dispatchEvent(new Event("projectsUpdated"))
      setIsProjectDetailModalOpen(false)
      setSelectedProject(null)
      loadProjectsAndColumns()
    } catch (error: any) {
      console.error("Error archiving project:", error)
      alert("Failed to archive project: " + error.message)
    }
  }

  const handleModalStatusChange = async (projectId: string, newStatus: string) => {
    try {
      await updateProjectStatus(projectId, newStatus)
      setSelectedProject((prev) => (prev ? { ...prev, status: newStatus } : null))
    } catch {
      // updateProjectStatus already logs
    }
  }

  // Filter projects
  const filteredProjects = useMemo(() => {
    console.log("🔎 Starting project filtering:", {
      totalProjects: projects.length,
      filters: filters,
      columns: columns.map(c => c.id),
    })
    
    let filtered = projects

    // Filter by primary/secondary owners
    if (filters.teamMemberIds.length > 0) {
      filtered = filtered.filter(
        (project) =>
          (project.primaryOwnerId && filters.teamMemberIds.includes(project.primaryOwnerId)) ||
          (project.secondaryOwnerId && filters.teamMemberIds.includes(project.secondaryOwnerId))
      )
      console.log("   After team filter:", filtered.length)
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter((project) => {
        const dueDate = new Date(project.dueDate)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
        
        switch (filters.dateRange) {
          case "this-week": {
            const weekFromNow = new Date(today)
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            return dueDateOnly >= today && dueDateOnly <= weekFromNow
          }
          case "this-month": {
            const monthFromNow = new Date(today)
            monthFromNow.setMonth(monthFromNow.getMonth() + 1)
            return dueDateOnly >= today && dueDateOnly <= monthFromNow
          }
          case "next-30-days": {
            const thirtyDaysFromNow = new Date(today)
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
            return dueDateOnly >= today && dueDateOnly <= thirtyDaysFromNow
          }
          case "overdue": {
            return dueDateOnly < today && project.status !== "completed"
          }
          default:
            return true
        }
      })
      console.log("   After date filter:", filtered.length)
    }

    // Filter by payment status
    if (filters.paymentStatus !== "all") {
      filtered = filtered.filter((project) => project.paymentStatus === filters.paymentStatus)
      console.log("   After payment filter:", filtered.length)
    }

    // Filter by priority
    if (filters.priority !== "all") {
      filtered = filtered.filter((project) => project.priority === filters.priority)
      console.log("   After priority filter:", filtered.length)
    }

    // Filter by project status - use BOTH filters.statuses AND columns to be resilient
    // If filters.statuses is empty or stale, fall back to all column IDs
    const statusesToFilter = filters.statuses.length > 0 ? filters.statuses : columns.map(c => c.id)
    const beforeStatusFilter = filtered.length
    filtered = filtered.filter((project) => statusesToFilter.includes(project.status))
    
    console.log("   Status filtering:", {
      statusesToFilter,
      projectStatuses: projects.map(p => p.status),
      beforeFilter: beforeStatusFilter,
      afterFilter: filtered.length,
    })

    console.log("✅ Filtering complete:", {
      filteredCount: filtered.length,
      originalCount: projects.length,
    })

    return filtered
  }, [projects, filters, columns])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.teamMemberIds.length > 0) count++
    if (filters.dateRange !== "all") count++
    if (filters.paymentStatus !== "all") count++
    if (filters.priority !== "all") count++
    if (filters.statuses.length !== columns.length) count++
    return count
  }, [filters, columns.length])

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      teamMemberIds: [],
      dateRange: "all",
      paymentStatus: "all",
      priority: "all",
      statuses: columns.map((column) => column.id),
    })
  }

  // Toggle status filter
  const toggleStatusFilter = (status: ProjectStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }))
  }

  const getColumnColor = (columnId: ProjectStatus) => {
    const column = columns.find((item) => item.id === columnId)
    const colorKey = column?.colorKey || columnId
    return (statusColors as Record<string, string>)[colorKey] || statusColors.neutral
  }

  const getColumnLabel = (columnId: ProjectStatus) =>
    columns.find((item) => item.id === columnId)?.label ?? columnId

  const slugifyColumnId = (label: string) =>
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")

  const getUniqueColumnId = (label: string) => {
    const base = slugifyColumnId(label) || "column"
    let nextId = base
    let counter = 1
    while (columns.some((column) => column.id === nextId)) {
      nextId = `${base}-${counter}`
      counter += 1
    }
    return nextId
  }

  const startColumnEdit = (column: Column) => {
    setEditingColumnId(column.id)
    setColumnDraft(column.label)
  }

  const commitColumnEdit = async () => {
    if (!editingColumnId) return
    const nextLabel = columnDraft.trim()
    if (!nextLabel) {
      setEditingColumnId(null)
      setColumnDraft("")
      return
    }

    if (!currentWorkspace?.id) {
      console.error("Cannot edit column: No workspace selected")
      return
    }

    // Find the column being edited to get its dbId
    const columnToEdit = columns.find((col) => col.id === editingColumnId)
    if (!columnToEdit?.dbId) {
      console.error("Cannot edit column: No database ID found")
      // For columns without dbId (default columns not yet saved), just update local state
      setColumns((prev) =>
        prev.map((column) =>
          column.id === editingColumnId ? { ...column, label: nextLabel } : column
        )
      )
      setEditingColumnId(null)
      setColumnDraft("")
      return
    }

    try {
      // Update in database
      const { error } = await supabase
        .from("project_statuses")
        .update({ label: nextLabel })
        .eq("id", columnToEdit.dbId)
        .eq("business_id", currentWorkspace.id)

      if (error) {
        console.error("Error updating column:", error)
        // TODO: Show user-friendly error message
        return
      }

      console.log("✅ Column updated in database")

      // Update local state only on success
      setColumns((prev) =>
        prev.map((column) =>
          column.id === editingColumnId ? { ...column, label: nextLabel } : column
        )
      )
      setEditingColumnId(null)
      setColumnDraft("")
    } catch (error) {
      console.error("Error updating column:", error)
      // TODO: Show user-friendly error message
    }
  }

  const cancelColumnEdit = () => {
    setEditingColumnId(null)
    setColumnDraft("")
  }

  const addColumn = async () => {
    const label = newColumnLabel.trim()
    if (!label) return
    
    if (!currentWorkspace?.id) {
      console.error("Cannot add column: No workspace selected")
      return
    }

    try {
      // Insert into database
      const { data, error } = await supabase
        .from("project_statuses")
        .insert({
          business_id: currentWorkspace.id,
          label: label,
          order_index: columns.length,
          color_key: "neutral",
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating column:", error)
        // TODO: Show user-friendly error message
        return
      }

      console.log("✅ Column created in database:", data)

      // Update local state with the new column including dbId
      const id = getUniqueColumnId(label)
      const newColumn: Column = {
        id,
        label,
        colorKey: "neutral",
        dbId: data.id,
      }

      setColumns((prev) => [...prev, newColumn])
      setFilters((prev) => ({ ...prev, statuses: [...prev.statuses, id] }))
      setIsAddingColumn(false)
      setNewColumnLabel("")
    } catch (error) {
      console.error("Error adding column:", error)
      // TODO: Show user-friendly error message
    }
  }

  const handleBoardWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!boardScrollRef.current) return
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    boardScrollRef.current.scrollLeft += event.deltaY
    // event.preventDefault() // Removed - causes passive event listener errors in console
  }

  // Time tracking functions
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatTimerDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startTimer = (projectId: string) => {
    setActiveTimer({
      projectId,
      startTime: new Date(),
      elapsed: 0,
    })
  }

  const stopTimer = () => {
    if (!activeTimer || !timeTrackingModal.projectId) return

    const durationMinutes = Math.floor(activeTimer.elapsed / 60)
    const newEntry: TimeEntry = {
      id: `t${Date.now()}`,
      userId: "current-user",
      userName: "You",
      startTime: activeTimer.startTime.toISOString(),
      endTime: new Date().toISOString(),
      duration: durationMinutes,
      notes: timerNotes,
      date: timerDate,
      billable: timerBillable,
      isActive: false,
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === timeTrackingModal.projectId
          ? { ...project, timeEntries: [...project.timeEntries, newEntry] }
          : project
      )
    )

    setActiveTimer(null)
    setTimerNotes("")
    setTimerBillable(true)
    setTimerDate(new Date().toISOString().split("T")[0])
  }

  const saveManualEntry = () => {
    if (!timeTrackingModal.projectId) return

    const hours = parseInt(manualHours) || 0
    const minutes = parseInt(manualMinutes) || 0
    const totalMinutes = hours * 60 + minutes

    if (totalMinutes === 0) return

    const now = new Date()
    const newEntry: TimeEntry = {
      id: `t${Date.now()}`,
      userId: "current-user",
      userName: "You",
      startTime: now.toISOString(),
      endTime: now.toISOString(),
      duration: totalMinutes,
      notes: manualNotes,
      date: manualDate,
      billable: manualBillable,
      isActive: false,
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === timeTrackingModal.projectId
          ? { ...project, timeEntries: [...project.timeEntries, newEntry] }
          : project
      )
    )

    setManualHours("")
    setManualMinutes("")
    setManualNotes("")
    setManualBillable(true)
    setManualDate(new Date().toISOString().split("T")[0])
  }

  const openTimeTracking = (projectId: string) => {
    setTimeTrackingModal({ isOpen: true, projectId })
    setTimerTab("timer")
  }

  const closeTimeTracking = () => {
    setTimeTrackingModal({ isOpen: false, projectId: null })
    if (activeTimer) {
      stopTimer()
    }
  }

  const hasActiveTimer = (projectId: string) => {
    return activeTimer?.projectId === projectId
  }

  const getTotalTimeForProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return 0
    return project.timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
  }

  // Timer interval effect
  useEffect(() => {
    if (activeTimer) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev) return null
          const elapsed = Math.floor((new Date().getTime() - prev.startTime.getTime()) / 1000)
          return { ...prev, elapsed }
        })
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [activeTimer])

  // File upload functions
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const openFileUpload = (projectId: string) => {
    setFileUploadModal({ isOpen: true, projectId })
  }

  const closeFileUpload = () => {
    setFileUploadModal({ isOpen: false, projectId: null })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !fileUploadModal.projectId) return

    const newFiles: ProjectFile[] = Array.from(files).map((file) => ({
      id: `f${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedBy: "You",
      uploadedAt: new Date().toISOString(),
      url: "#",
    }))

    setProjects((prev) =>
      prev.map((project) =>
        project.id === fileUploadModal.projectId
          ? { ...project, files: [...project.files, ...newFiles] }
          : project
      )
    )

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const deleteFile = (projectId: string, fileId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, files: project.files.filter((f) => f.id !== fileId) }
          : project
      )
    )
  }

  // Unified drag end handler for both columns and projects
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, type } = result

    // Handle column reordering
    if (type === "column") {
      if (source.index === destination.index) return
      
      const newColumns = Array.from(columns)
      const [removed] = newColumns.splice(source.index, 1)
      newColumns.splice(destination.index, 0, removed)
      
      setColumns(newColumns)
      
      // Update column order in database
      try {
        if (!currentWorkspace?.id) {
          console.error("Cannot update column order: No workspace selected")
          return
        }

        // Update each column's order_index in the database
        const updatePromises = newColumns
          .filter((col) => col.dbId) // Only update columns that have a database ID
          .map((col, index) =>
            supabase
              .from("project_statuses")
              .update({ order_index: index })
              .eq("id", col.dbId)
              .eq("business_id", currentWorkspace.id)
          )

        const results = await Promise.all(updatePromises)
        
        // Check if any updates failed
        const hasErrors = results.some((result) => result.error)
        if (hasErrors) {
          console.error("Some column order updates failed:", results)
          // TODO: Show user-friendly error message
        } else {
          console.log("✅ Column order updated in database")
        }
      } catch (error) {
        console.error("Error updating column order:", error)
        // TODO: Show user-friendly error message
      }
      return
    }

    // Handle project dragging between columns
    if (type === "project") {
      const { draggableId } = result
      
      if (source.droppableId === destination.droppableId) return

      const newStatus = destination.droppableId as ProjectStatus
      
      console.log("🔄 Dragging project:", draggableId, "to status:", newStatus)
      
      // Optimistically update UI
      setProjects((prev) =>
        prev.map((project) =>
          project.id === draggableId ? { ...project, status: newStatus } : project
        )
      )

      // Update in database
      try {
        await updateProjectStatus(draggableId, newStatus)
        console.log("✅ Project status updated in database")
      } catch (error) {
        console.error("❌ Error updating project status:", error)
        // Revert on error
        await loadProjectsAndColumns()
      }
    }
  }

  const getProjectsByStatus = (status: ProjectStatus) =>
    filteredProjects.filter((p) => p.status === status)

  const stats = {
    activeProjects: filteredProjects.filter((p) => p.status !== "completed").length,
    pendingInvoices: filteredProjects.filter((p) => p.paymentStatus === "pending").length * 5000,
    overdueTasks: 3,
    teamWorkload: 78,
  }
  
  const hasActiveFilters = activeFilterCount > 0

  const copyErrorToClipboard = () => {
    if (!loadError) return
    navigator.clipboard.writeText(loadError).then(() => {
      // Optional: brief feedback could go here
    })
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Error toast — only when there is a load error */}
        {loadError && isAuthReady && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error loading projects</p>
                <p className="text-sm text-red-700 dark:text-red-300 break-words select-all" title={loadError}>
                  {loadError}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={copyErrorToClipboard}
                  title="Copy error"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={loadProjectsAndColumns}
                >
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={() => setLoadError(null)}
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Loading State */}
        {(authLoading || workspacesLoading) && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {authLoading ? "Authenticating..." : "Loading your workspaces..."}
              </p>
            </div>
          </div>
        )}

        {/* Projects Loading State */}
        {!authLoading && !workspacesLoading && isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading projects...</p>
            </div>
          </div>
        )}

        {/* Selecting workspace - workspaces exist but none selected yet */}
        {isAuthReady && !authLoading && !workspacesLoading && workspaces.length > 0 && !businessId && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Selecting workspace...</p>
            </div>
          </div>
        )}

        {/* No Workspaces State - Only show after auth is fully ready */}
        {isAuthReady && !authLoading && !workspacesLoading && workspaces.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Workspaces Found</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You don't have access to any workspaces yet. Create a new workspace to get started.
              </p>
              <Button onClick={() => router.push("/settings")}>
                Create Workspace
              </Button>
            </div>
          </div>
        )}

        {/* Content - only when we have a workspace selected */}
        {isAuthReady && !authLoading && !workspacesLoading && !isLoading && !loadError && businessId && (
          <>
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Projects</span>
                <FolderKanban className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-3xl font-semibold">
                {stats.activeProjects}
                {hasActiveFilters && (
                  <span className="text-xs text-gray-500 ml-2">(filtered)</span>
                )}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">+2 this week</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Invoices</span>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-3xl font-semibold">
                ${stats.pendingInvoices.toLocaleString()}
                {hasActiveFilters && (
                  <span className="text-xs text-gray-500 ml-2">(filtered)</span>
                )}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                {filteredProjects.filter((p) => p.paymentStatus === "pending").length} invoices
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overdue Tasks</span>
                <AlertCircle className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-3xl font-semibold">{stats.overdueTasks}</div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Needs attention</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Team Workload</span>
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-3xl font-semibold">{stats.teamWorkload}%</div>
              <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black dark:bg-white rounded-full"
                  style={{ width: `${stats.teamWorkload}%` }}
                />
              </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <Badge className="bg-black dark:bg-white text-white dark:text-black text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 flex-1">
              {/* Team Member Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[160px] h-9 text-sm justify-between font-normal"
                  >
                    {filters.teamMemberIds.length === 0
                      ? "All Members"
                      : filters.teamMemberIds.length === 1
                        ? workspaceMembersForFilter.find((m) => m.userId === filters.teamMemberIds[0])
                          ? [workspaceMembersForFilter.find((m) => m.userId === filters.teamMemberIds[0])!.firstName, workspaceMembersForFilter.find((m) => m.userId === filters.teamMemberIds[0])!.lastName]
                              .filter(Boolean)
                              .join(" ")
                              .trim() ||
                            workspaceMembersForFilter.find((m) => m.userId === filters.teamMemberIds[0])!.email ||
                            "1 member"
                          : "1 member"
                        : `${filters.teamMemberIds.length} members`}
                    <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px] max-h-[280px] overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, teamMemberIds: [] }))
                    }
                  >
                    All Members
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {workspaceMembersForFilter.map((member) => {
                    const displayName =
                      [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
                      member.email ||
                      member.userId
                    return (
                      <DropdownMenuCheckboxItem
                        key={member.userId}
                        checked={filters.teamMemberIds.includes(member.userId)}
                        onCheckedChange={(checked) => {
                          setFilters((prev) =>
                            checked
                              ? { ...prev, teamMemberIds: [...prev.teamMemberIds, member.userId] }
                              : {
                                  ...prev,
                                  teamMemberIds: prev.teamMemberIds.filter((id) => id !== member.userId),
                                }
                          )
                        }}
                      >
                        {displayName}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Date Range Filter */}
              <Select
                value={filters.dateRange}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="next-30-days">Next 30 Days</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Status Filter */}
              <Select
                value={filters.paymentStatus}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, paymentStatus: value }))
                }
              >
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Checkboxes */}
              <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-black">
                {columns.map((column) => (
                  <button
                    key={column.id}
                    onClick={() => toggleStatusFilter(column.id)}
                    className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                      filters.statuses.includes(column.id)
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {column.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-sm flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="flex items-center gap-3">
            {isAddingColumn ? (
              <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-800 rounded-lg p-1 bg-white dark:bg-black">
                <Input
                  value={newColumnLabel}
                  onChange={(e) => setNewColumnLabel(e.target.value)}
                  placeholder="Column name"
                  className="h-8 w-40 border-0 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addColumn()
                    if (e.key === "Escape") {
                      setIsAddingColumn(false)
                      setNewColumnLabel("")
                    }
                  }}
                  autoFocus
                />
                <Button size="sm" className="h-8" onClick={addColumn}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => {
                    setIsAddingColumn(false)
                    setNewColumnLabel("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsAddingColumn(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add column
              </Button>
            )}
            <div className="flex items-center gap-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === "board"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Board
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {viewMode === "board" && (
          projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Get started by creating your first project"
              action={{
                label: "Create Project",
                onClick: () => setIsNewProjectOpen(true),
              }}
            />
          ) : (
          <div className="flex gap-4 lg:gap-6">
            <div
              ref={boardScrollRef}
              onWheel={handleBoardWheel}
              className="flex-1 min-w-0 overflow-x-auto no-scrollbar"
            >
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="all-columns" direction="horizontal" type="column">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex gap-4 pb-2 min-w-max"
                    >
                      {columns.map((column, index) => (
                        <Draggable key={column.id} draggableId={column.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex flex-col min-w-[280px] max-w-[320px] shrink-0 ${
                                snapshot.isDragging ? "opacity-50" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3 group">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                  {editingColumnId === column.id ? (
                                    <Input
                                      value={columnDraft}
                                      onChange={(e) => setColumnDraft(e.target.value)}
                                      onBlur={commitColumnEdit}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") commitColumnEdit()
                                        if (e.key === "Escape") cancelColumnEdit()
                                      }}
                                      className="h-7 w-36 text-sm"
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      onClick={() => startColumnEdit(column)}
                                      className="font-semibold text-left truncate hover:underline"
                                    >
                                      {column.label}
                                    </button>
                                  )}
                                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-900 px-2 py-0.5 rounded-full">
                                    {getProjectsByStatus(column.id).length}
                                  </span>
                                </div>
                              </div>

                              <Droppable droppableId={column.id} type="project">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 space-y-3 p-3 rounded-xl border-2 border-dashed min-h-[200px] transition-colors ${
                            snapshot.isDraggingOver
                              ? "border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                              : "border-gray-200 dark:border-gray-800"
                          }`}
                        >
                          {getProjectsByStatus(column.id).map((project, index) => (
                            <Draggable key={project.id} draggableId={project.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black cursor-move transition-shadow ${
                                    snapshot.isDragging ? "shadow-lg" : "hover:shadow-md"
                                  }`}
                                >
                                  <div className="space-y-3">
                                    <div>
                                      <h4 
                                        className="font-medium text-sm mb-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedProject(project)
                                          setIsProjectDetailModalOpen(true)
                                        }}
                                      >
                                        {project.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {project.client}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                          {new Date(project.dueDate).toLocaleDateString()}
                                        </span>
                                      </div>

                                      <div className="flex -space-x-2 items-center">
                                        {[project.primaryOwner, project.secondaryOwner].filter(Boolean).map((owner, i) => (
                                          <Avatar key={i} className="w-6 h-6 border-2 border-white dark:border-black flex-shrink-0">
                                            <AvatarImage src={owner!.avatar} alt="" />
                                            <AvatarFallback className="text-[10px] bg-gray-200 dark:bg-gray-800">
                                              {owner!.name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                        ))}
                                      </div>

                                    <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-900">
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <StickyNote className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openFileUpload(project.id)
                                        }}
                                      >
                                        <Paperclip className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-7 w-7 relative ${
                                          hasActiveTimer(project.id) ? "text-green-600 dark:text-green-400" : ""
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openTimeTracking(project.id)
                                        }}
                                      >
                                        <Clock className="w-3.5 h-3.5" />
                                        {hasActiveTimer(project.id) && (
                                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedProject(project)
                                          setIsProjectDetailModalOpen(true)
                                        }}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>
            </div>

            {/* Activity Sidebar */}
            <aside className="hidden xl:block w-80 space-y-4">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
                      {activity.type === "note" && <StickyNote className="w-4 h-4" />}
                      {activity.type === "payment" && <DollarSign className="w-4 h-4" />}
                      {activity.type === "file" && <Paperclip className="w-4 h-4" />}
                      {activity.type === "status" && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user} · {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </aside>
          </div>
          )
        )}

        {/* List View */}
        {viewMode === "list" && (
          projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Get started by creating your first project"
              action={{
                label: "Create Project",
                onClick: () => setIsNewProjectOpen(true),
              }}
            />
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No projects match your filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedProject(project)
                    setIsProjectDetailModalOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-base truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{project.title}</h3>
                        <Badge className={getColumnColor(project.status)}>
                          {getColumnLabel(project.status)}
                        </Badge>
                        {project.priority === "high" && (
                          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{project.client}</p>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {new Date(project.dueDate).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Owner & sub-owner */}
                    <div className="flex -space-x-2 items-center">
                      {[project.primaryOwner, project.secondaryOwner].filter(Boolean).map((owner, i) => (
                        <Avatar key={i} className="w-8 h-8 border-2 border-white dark:border-black flex-shrink-0">
                          <AvatarImage src={owner!.avatar} alt="" />
                          <AvatarFallback className="text-[10px] bg-gray-200 dark:bg-gray-800">
                            {owner!.name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>

                    {/* Payment Status */}
                    <Badge className={`${paymentColors[project.paymentStatus]} min-w-[80px] justify-center`}>
                      {project.paymentStatus}
                    </Badge>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      >
                        <StickyNote className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          openFileUpload(project.id)
                        }}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 relative ${
                          hasActiveTimer(project.id) ? "text-green-600 dark:text-green-400" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          openTimeTracking(project.id)
                        }}
                      >
                        <Clock className="w-4 h-4" />
                        {hasActiveTimer(project.id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/projects/${project.id}`)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Floating Action Button */}
      <button
        onClick={() => setIsNewProjectOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* New Project Modal */}
      <Dialog open={isNewProjectOpen} onOpenChange={(open) => {
        setIsNewProjectOpen(open)
        if (!open) {
          // Reset form when closing
          setNewProject({
            title: "",
            status: "lead",
            priority: "medium",
            paymentStatus: "pending",
            client: "",
            clientId: null,
            clientEmail: "",
            clientPhone: "",
            clientAddress: "",
            startDate: "",
            dueDate: "",
            expectedCompletion: "",
            budget: "",
            description: "",
            source: "",
            interest: "",
            painPoints: "",
            notes: "",
            budgetMin: "",
            temperature: "",
            industry: "",
            companyName: "",
            companySize: "",
            location: "",
            jobTitle: "",
          })
          setSelectedTeamMembers([])
          setInitialTasks([])
          setCreateModalTab("basic")
          setCreateError(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project or lead to your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {createError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400 mb-4">
                {createError}
              </div>
            )}
            
            <Tabs value={createModalTab} onValueChange={(v) => setCreateModalTab(v as "basic" | "client" | "details" | "timeline" | "team")}>
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Title *</label>
                  <input
                    type="text"
                    placeholder="Enter project name"
                    value={newProject.title}
                    onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Initial Status</label>
                    <Select 
                      value={newProject.status}
                      onValueChange={(value) => setNewProject(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={newProject.priority}
                      onValueChange={(value) => setNewProject(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select 
                    value={newProject.paymentStatus}
                    onValueChange={(value) => setNewProject(prev => ({ ...prev, paymentStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    placeholder="Enter project description"
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 resize-none"
                  />
                </div>
              </TabsContent>

              {/* Client Details Tab */}
              <TabsContent value="client" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <p className="text-xs text-gray-500">Search for an existing client or create a new one.</p>
                  <ClientSelect
                    value={{ clientId: newProject.clientId, displayName: newProject.client }}
                    onChange={({ clientId, displayName }) =>
                      setNewProject(prev => ({ ...prev, clientId, client: displayName }))
                    }
                    placeholder="Search for a client..."
                  />
                </div>
              </TabsContent>

              {/* Details Tab (Lead-origin fields) */}
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
                  <input
                    type="text"
                    placeholder="What are they interested in?"
                    value={newProject.interest}
                    onChange={(e) => setNewProject(prev => ({ ...prev, interest: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
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
                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium capitalize transition-colors ${
                          newProject.temperature === temp
                            ? temp === "cold"
                              ? "border-blue-500 bg-blue-500/10 text-blue-600"
                              : temp === "warm"
                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                                : "border-red-500 bg-red-500/10 text-red-600"
                            : "border-gray-200 dark:border-gray-800 text-gray-500"
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pain Points</label>
                  <textarea
                    placeholder="What challenges is the client facing?"
                    value={newProject.painPoints}
                    onChange={(e) => setNewProject(prev => ({ ...prev, painPoints: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      value={newProject.companyName}
                      onChange={(e) => setNewProject(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <input
                      type="text"
                      placeholder="Real Estate, Construction..."
                      value={newProject.industry}
                      onChange={(e) => setNewProject(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input
                      type="text"
                      placeholder="City, State"
                      value={newProject.location}
                      onChange={(e) => setNewProject(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    placeholder="General notes about this project..."
                    value={newProject.notes}
                    onChange={(e) => setNewProject(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 resize-none"
                  />
                </div>
              </TabsContent>

              {/* Timeline & Budget Tab */}
              <TabsContent value="timeline" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <input
                      type="date"
                      value={newProject.dueDate}
                      onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Completion</label>
                  <input
                    type="date"
                    value={newProject.expectedCompletion}
                    onChange={(e) => setNewProject(prev => ({ ...prev, expectedCompletion: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newProject.budget}
                      onChange={(e) => setNewProject(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Tasks (Optional)</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add tasks that need to be done for this project</p>
                  {initialTasks.map((task, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Task title"
                        value={task.title}
                        onChange={(e) => {
                          const newTasks = [...initialTasks]
                          newTasks[index].title = e.target.value
                          setInitialTasks(newTasks)
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setInitialTasks(initialTasks.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInitialTasks([...initialTasks, { title: "" }])}
                    className="w-full"
                  >
                    + Add Task
                  </Button>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team Members (Optional)</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select team members to assign to this project</p>
                  
                  {loadingWorkspaceUsers ? (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center text-sm text-gray-500">
                      Loading team members...
                    </div>
                  ) : workspaceUsers.length === 0 ? (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center text-sm text-gray-500">
                      No team members found in this workspace
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                      {workspaceUsers.map((user) => (
                        <label key={user.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedTeamMembers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeamMembers([...selectedTeamMembers, user.id])
                              } else {
                                setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== user.id))
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {selectedTeamMembers.length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {selectedTeamMembers.length} team member{selectedTeamMembers.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={isCreatingProject || !newProject.title.trim()}
            >
              {isCreatingProject ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Tracking Modal */}
      <Dialog open={timeTrackingModal.isOpen} onOpenChange={(open) => !open && closeTimeTracking()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Time Tracking - {projects.find((p) => p.id === timeTrackingModal.projectId)?.title}
            </DialogTitle>
            <DialogDescription>
              Track time spent on this project with a timer or manual entry.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={timerTab} onValueChange={(v) => setTimerTab(v as "timer" | "manual")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            {/* Timer Tab */}
            <TabsContent value="timer" className="space-y-4 mt-4">
              <div className="flex flex-col items-center justify-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-5xl font-mono font-semibold mb-6">
                  {activeTimer ? formatTimerDisplay(activeTimer.elapsed) : "00:00:00"}
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    if (activeTimer) {
                      stopTimer()
                    } else if (timeTrackingModal.projectId) {
                      startTimer(timeTrackingModal.projectId)
                    }
                  }}
                  className="w-32"
                >
                  {activeTimer ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={timerDate}
                    onChange={(e) => setTimerDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="What did you work on?"
                    value={timerNotes}
                    onChange={(e) => setTimerNotes(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timer-billable"
                    checked={timerBillable}
                    onCheckedChange={(checked) => setTimerBillable(checked as boolean)}
                  />
                  <label
                    htmlFor="timer-billable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Billable
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hours</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minutes</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="What did you work on?"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manual-billable"
                  checked={manualBillable}
                  onCheckedChange={(checked) => setManualBillable(checked as boolean)}
                />
                <label
                  htmlFor="manual-billable"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Billable
                </label>
              </div>

              <Button onClick={saveManualEntry} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Time Entry
              </Button>
            </TabsContent>
          </Tabs>

          {/* Time Entries List */}
          {timeTrackingModal.projectId && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Time Entries</h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total: {formatDuration(getTotalTimeForProject(timeTrackingModal.projectId))}
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {projects
                  .find((p) => p.id === timeTrackingModal.projectId)
                  ?.timeEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{entry.userName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            {entry.billable && (
                              <Badge className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                Billable
                              </Badge>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{entry.notes}</p>
                          )}
                        </div>
                        <span className="font-semibold text-sm ml-4">
                          {formatDuration(entry.duration)}
                        </span>
                      </div>
                    </div>
                  ))}

                {projects.find((p) => p.id === timeTrackingModal.projectId)?.timeEntries.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No time entries yet. Start tracking time to see entries here.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeTimeTracking}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Modal */}
      <Dialog open={fileUploadModal.isOpen} onOpenChange={(open) => !open && closeFileUpload()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              File Attachments - {projects.find((p) => p.id === fileUploadModal.projectId)?.title}
            </DialogTitle>
            <DialogDescription>
              Upload files and documents related to this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">Any file type, up to 50MB each</p>
              </label>
            </div>

            {/* Files List */}
            {fileUploadModal.projectId && (
              <div>
                <h3 className="font-semibold mb-3">
                  Uploaded Files ({projects.find((p) => p.id === fileUploadModal.projectId)?.files.length || 0})
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {projects
                    .find((p) => p.id === fileUploadModal.projectId)
                    ?.files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                    .map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                            <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{file.uploadedBy}</span>
                              <span>•</span>
                              <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => fileUploadModal.projectId && deleteFile(fileUploadModal.projectId, file.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                  {projects.find((p) => p.id === fileUploadModal.projectId)?.files.length === 0 && (
                    <p className="text-center text-sm text-gray-500 py-8">
                      No files uploaded yet. Upload your first file above.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFileUpload}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Detail Modal */}
      <Dialog
        open={isProjectDetailModalOpen}
        onOpenChange={(open) => {
          setIsProjectDetailModalOpen(open)
          if (!open) {
            setAssignModalOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] h-[90vh] p-0 overflow-hidden flex flex-col">
          {selectedProject && (
            <>
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold">{selectedProject.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedProject.client}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedProject.businessId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignModalOpen(true)}
                        className="gap-1.5"
                      >
                        <Users className="w-4 h-4" />
                        Assign Team
                      </Button>
                    )}
                    <Select
                      value={
                        columns.some((c) => c.id === selectedProject.status)
                          ? selectedProject.status
                          : columns[0]?.id ?? selectedProject.status
                      }
                      onValueChange={(v) => handleModalStatusChange(selectedProject.id, v)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`/projects/${selectedProject.id}`, "_blank")
                          }
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Full Page
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-orange-600"
                          onClick={() =>
                            archiveProjectFromModal(
                              selectedProject.id,
                              selectedProject.businessId
                            )
                          }
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Modal Content - Full Project Detail */}
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
                <ProjectDetailContent projectId={selectedProject.id} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {selectedProject?.businessId && (
        <AssignTeamModal
          open={assignModalOpen}
          projectId={selectedProject.id}
          businessId={selectedProject.businessId}
          currentPrimaryOwnerId={selectedProject.primaryOwnerId ?? null}
          currentSecondaryOwnerId={selectedProject.secondaryOwnerId ?? null}
          onClose={() => setAssignModalOpen(false)}
          onSave={() => {
            setAssignModalOpen(false)
            window.dispatchEvent(new Event("projectAssignmentsUpdated"))
            loadProjectsAndColumns()
          }}
        />
      )}
      </>
        )}
      </div>
    </DashboardLayout>
  )
}
