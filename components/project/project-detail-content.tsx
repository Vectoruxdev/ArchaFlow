"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { supabase } from "@/lib/supabase/client"
import { authFetch } from "@/lib/auth/auth-fetch"
import { toast } from "@/lib/toast"
import {
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Plus,
  Paperclip,
  FileText,
  MessageSquare,
  Trash2,
  Edit,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Upload,
  Download,
  File,
  GripVertical,
  Building2,
  Briefcase,
  Target,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Spinner } from "@/components/design-system"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useAuth } from "@/lib/auth/auth-context"
import { ProjectContractsSection } from "./project-contracts-section"
import { SiteImageGenerationModal, type SiteImageGenStep, type EnhanceMode } from "./site-image-generation-modal"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { ProjectImageGallery } from "./project-image-gallery"
import { Expand } from "lucide-react"

// Types
interface TaskNote {
  id: string
  author: string
  content: string
  timestamp: string
}

interface TimeEntry {
  id: string
  user: string
  duration: number // in minutes
  date: string
  notes: string
}

interface TaskAttachment {
  id: string
  name: string
  size: string
  type: "pdf" | "image" | "document"
  uploadedBy: string
  uploadedAt: string
}

interface TodoSubtask {
  id: string
  title: string
  completed: boolean
  assignedTo?: string
  dueDate?: string
  description?: string
  notes?: string
  completedBy?: string
  completedAt?: string
}

interface Todo {
  id: string
  title: string
  completed: boolean
  assignedTo?: string
  dueDate?: string
  priority?: "high" | "medium" | "low"
  subtasks: TodoSubtask[]
  description?: string
  notes: TaskNote[]
  timeEntries: TimeEntry[]
  attachments: TaskAttachment[]
  completedBy?: string
  completedAt?: string
}

interface Note {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
}

interface ProjectFile {
  id: string
  name: string
  type: "pdf" | "image" | "document"
  size: string
  uploadedBy: string
  uploadedAt: string
  version?: string
  url?: string
}

interface Invoice {
  id: string
  invoice_number: string
  issue_date: string
  total: number
  amount_paid: number
  amount_due: number
  status: string
  due_date: string
}

interface Project {
  id: string
  title: string
  client: {
    name: string
    email: string
    phone: string
    address: string
  }
  status: "lead" | "sale" | "design" | "completed"
  startDate: string
  expectedCompletion: string
  dueDate: string
  budget: number
  budgetMin: number | null
  spent: number
  paymentStatus: "pending" | "partial" | "paid"
  description: string
  assignedTeam: Array<{ name: string; avatar: string; role: string }>
  timeLogged: string
  business_id?: string
  primary_owner_id?: string | null
  secondary_owner_id?: string | null
  // Lead-origin fields
  source: string | null
  interest: string | null
  painPoints: string | null
  notes: string | null
  temperature: string | null
  leadScore: number | null
  nextAction: string | null
  nextActionDate: string | null
  companyName: string | null
  jobTitle: string | null
  industry: string | null
  companySize: string | null
  location: string | null
  leadId: string | null
}

// Mock Data (fallback for loading)
const projectData = {
  id: "1",
  title: "Kanab Custom Home",
  client: {
    name: "Sarah & Michael Thompson",
    email: "sarah.thompson@email.com",
    phone: "(435) 555-0123",
    address: "Kanab, Utah 84741",
  },
  status: "design" as const,
  startDate: "2026-01-15",
  expectedCompletion: "2026-06-15",
  dueDate: "2026-06-30",
  budget: 450000,
  spent: 125000,
  paymentStatus: "partial" as const,
  description:
    "Custom 3,500 sq ft modern mountain home with sustainable design elements, large windows for natural light, and integration with the surrounding landscape.",
  assignedTeam: [
    { name: "James Wilson", avatar: "", role: "Lead Architect" },
    { name: "Emma Davis", avatar: "", role: "Interior Designer" },
    { name: "Mike Chen", avatar: "", role: "Project Manager" },
  ],
  timeLogged: "142 hours",
  // Lead-origin fields
  source: null,
  interest: null,
  painPoints: null,
  notes: null,
  budgetMin: null,
  temperature: null,
  leadScore: null,
  nextAction: null,
  nextActionDate: null,
  companyName: null,
  jobTitle: null,
  industry: null,
  companySize: null,
  location: null,
  leadId: null,
}

const sourceLabels: Record<string, string> = {
  website_form: "Website Form",
  email_campaign: "Email Campaign",
  social_media: "Social Media",
  referral: "Referral",
  cold_call: "Cold Call",
  ad: "Advertisement",
  trade_show: "Trade Show",
  other: "Other",
}

const temperatureStyles: Record<string, string> = {
  cold: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
  warm: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  hot: "bg-[--af-danger-bg]0/10 text-[--af-danger-text] border-[--af-danger-border]/20",
}

// No mock data - clean slate for new projects
const initialTodos: Todo[] = []

const notes: Note[] = []

const files: ProjectFile[] = []

const invoices: Invoice[] = []

const statusColors = {
  lead: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
  sale: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  design: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  completed: "bg-[--af-success-bg]0/10 text-[--af-success-text] border-[--af-success-border]/20",
}

const paymentColors = {
  pending: "bg-[--af-danger-bg]0/10 text-[--af-danger-text]",
  partial: "bg-[--af-warning-bg]0/10 text-[--af-warning-text]",
  paid: "bg-[--af-success-bg]0/10 text-[--af-success-text]",
}

const priorityColors = {
  high: "bg-[--af-danger-bg]0/10 text-[--af-danger-text] border-[--af-danger-border]/20",
  medium: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  low: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
}

const invoiceStatusColors: Record<string, string> = {
  draft: "bg-[--af-bg-canvas]0/10 text-[--af-text-secondary] border-[--af-border-default]",
  sent: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
  viewed: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  partially_paid: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  paid: "bg-[--af-success-bg]0/10 text-[--af-success-text] border-[--af-success-border]/20",
  overdue: "bg-[--af-danger-bg]0/10 text-[--af-danger-text] border-[--af-danger-border]/20",
  void: "bg-[--af-bg-canvas]0/10 text-[--af-text-muted] dark:text-[--af-text-muted] border-[--af-border-default]",
}

interface ProjectDetailContentProps {
  projectId: string
}

export function ProjectDetailContent({ projectId }: ProjectDetailContentProps) {
  const { currentWorkspace, refreshWorkspaces } = useAuth()
  const [project, setProject] = useState<Project>(projectData as Project)
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [projectNotes, setProjectNotes] = useState<Note[]>(notes)
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(files)
  const [projectInvoices, setProjectInvoices] = useState<Invoice[]>(invoices)
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set(["2"]))
  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false)
  const [newTodoTitle, setNewTodoTitle] = useState("")
  const [newTodoAssignee, setNewTodoAssignee] = useState("")
  const [newTodoDueDate, setNewTodoDueDate] = useState("")
  const [newTodoPriority, setNewTodoPriority] = useState<"high" | "medium" | "low">("medium")
  const [newNote, setNewNote] = useState("")
  
  // Workspace members for assignment dropdowns
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ userId: string; name: string; avatar: string }>>([])

  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // AI Site Image generation state
  const [isGeneratingSiteImage, setIsGeneratingSiteImage] = useState(false)
  const [siteImageGenStep, setSiteImageGenStep] = useState<SiteImageGenStep>(null)
  const [siteImageGenError, setSiteImageGenError] = useState<string>("")
  const [siteImageGenUrls, setSiteImageGenUrls] = useState<string[]>([])

  // Image gallery / lightbox state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  
  // AI credit state (from workspace)
  const aiCreditsUsed = currentWorkspace?.aiCreditsUsed ?? 0
  const aiCreditsLimit = currentWorkspace?.aiCreditsLimit ?? 0
  const creditsRemaining = Math.max(0, aiCreditsLimit - aiCreditsUsed)

  // Task Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Todo | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [taskDetailTab, setTaskDetailTab] = useState("overview")
  
  // Inline Subtask Creation State
  const [addingSubtaskForTodo, setAddingSubtaskForTodo] = useState<string | null>(null)
  const [newInlineSubtaskTitle, setNewInlineSubtaskTitle] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [suppressDeleteWarning, setSuppressDeleteWarning] = useState(false)
  
  // Current logged-in user (mock)
  const currentUser = "James Wilson"

  // Load project data from Supabase
  useEffect(() => {
    loadProjectData()
  }, [projectId])

  // Refetch when Assign Team modal saves (so Team Members section updates)
  useEffect(() => {
    const handler = () => loadProjectData()
    window.addEventListener("projectAssignmentsUpdated", handler)
    return () => window.removeEventListener("projectAssignmentsUpdated", handler)
  }, [projectId])

  // Reload data when session is refreshed (e.g. after returning from idle tab)
  useEffect(() => {
    const onSessionRefreshed = () => loadProjectData()
    window.addEventListener("session-refreshed", onSessionRefreshed)
    return () => window.removeEventListener("session-refreshed", onSessionRefreshed)
  }, [projectId])

  const loadProjectData = async () => {
    setIsLoading(true)
    setLoadError(null)

    const projectRelations = `
          project_tasks(*),
          project_notes(*),
          project_files(*),
          project_assignments(user_id)
        `
    const projectColumnsWithoutOwners =
      "id, title, client_name, client_email, client_phone, client_address, status, start_date, expected_completion, due_date, budget, budget_min, spent, payment_status, description, business_id, source, interest, pain_points, notes, temperature, lead_score, next_action, next_action_date, company_name, job_title, industry, company_size, location, lead_id"

    try {
      let projectData: any
      let projectError: any

      const res = await supabase
        .from("projects")
        .select(`*, ${projectRelations}`)
        .eq("id", projectId)
        .single()
      projectData = res.data
      projectError = res.error

      if (projectError && typeof projectError.message === "string" && projectError.message.includes("primary_owner_id")) {
        const fallback = await supabase
          .from("projects")
          .select(`${projectColumnsWithoutOwners}, ${projectRelations}`)
          .eq("id", projectId)
          .single()
        projectData = fallback.data
        projectError = fallback.error
        if (projectData) {
          projectData.primary_owner_id = null
          projectData.secondary_owner_id = null
        }
      }

      if (projectError) throw projectError

      if (projectData) {
        // Transform and set project data - map all fields from database
        setProject({
          id: projectData.id,
          title: projectData.title,
          client: {
            name: projectData.client_name || "Unknown Client",
            email: projectData.client_email || "",
            phone: projectData.client_phone || "",
            address: projectData.client_address || "",
          },
          status: projectData.status,
          startDate: projectData.start_date || "",
          expectedCompletion: projectData.expected_completion || "",
          dueDate: projectData.due_date || "",
          budget: projectData.budget || 0,
          budgetMin: projectData.budget_min || null,
          spent: projectData.spent || 0,
          paymentStatus: projectData.payment_status || "pending",
          description: projectData.description || "",
          assignedTeam: [], // Will be populated below from primary/secondary owners
          timeLogged: "0 hours", // Will be calculated below
          business_id: projectData.business_id,
          primary_owner_id: projectData.primary_owner_id ?? null,
          secondary_owner_id: projectData.secondary_owner_id ?? null,
          // Lead-origin fields
          source: projectData.source || null,
          interest: projectData.interest || null,
          painPoints: projectData.pain_points || null,
          notes: projectData.notes || null,
          temperature: projectData.temperature || null,
          leadScore: projectData.lead_score ?? null,
          nextAction: projectData.next_action || null,
          nextActionDate: projectData.next_action_date || null,
          companyName: projectData.company_name || null,
          jobTitle: projectData.job_title || null,
          industry: projectData.industry || null,
          companySize: projectData.company_size || null,
          location: projectData.location || null,
          leadId: projectData.lead_id || null,
        })

        // Load all workspace members for assignment dropdowns + resolve owners
        let teamMembers: Array<{ name: string; avatar: string; role: string }> = []
        const businessId = projectData.business_id
        const primaryId = projectData.primary_owner_id
        const secondaryId = projectData.secondary_owner_id
        if (businessId) {
          try {
            const res = await authFetch(`/api/teams/members?businessId=${encodeURIComponent(businessId)}`)
            if (res.ok) {
              const membersList: Array<{ userId: string; firstName: string; lastName: string; email: string; avatarUrl?: string }> = await res.json()
              const displayName = (m: { firstName?: string; lastName?: string; email?: string; userId?: string }) =>
                [m.firstName, m.lastName].filter(Boolean).join(" ").trim() || m.email || m.userId || "Unknown"

              // Store all members for task assignment dropdown
              setWorkspaceMembers(
                (membersList || []).map((m: any) => ({
                  userId: m.userId,
                  name: displayName(m),
                  avatar: m.avatarUrl || "",
                }))
              )

              // Resolve primary/secondary owners for team display
              const byId = Object.fromEntries((membersList || []).map((m: any) => [m.userId, m]))
              if (primaryId && byId[primaryId]) {
                teamMembers.push({ name: displayName(byId[primaryId]), avatar: byId[primaryId].avatarUrl || "", role: "Primary owner" })
              }
              if (secondaryId && byId[secondaryId]) {
                teamMembers.push({ name: displayName(byId[secondaryId]), avatar: byId[secondaryId].avatarUrl || "", role: "Secondary owner" })
              }
            }
          } catch (_) {
            // keep assignedTeam empty on error
          }
        }

        setProject(prev => ({
          ...prev,
          assignedTeam: teamMembers,
        }))

        // Transform tasks
        const loadedTasks = (projectData.project_tasks || [])
          .filter((task: any) => !task.parent_task_id)
          .map((task: any) => ({
            id: task.id,
            title: task.title,
            completed: task.completed,
            assignedTo: task.assigned_to,
            dueDate: task.due_date,
            priority: task.priority,
            description: task.description,
            subtasks: (projectData.project_tasks || [])
              .filter((st: any) => st.parent_task_id === task.id)
              .map((st: any) => ({
                id: st.id,
                title: st.title,
                completed: st.completed,
                completedBy: st.completed_by,
                completedAt: st.completed_at,
              })),
            notes: [],
            timeEntries: [],
            attachments: [],
            completedBy: task.completed_by,
            completedAt: task.completed_at,
          }))

        setTodos(loadedTasks)

        // Fetch invoices for this project from the invoices table
        const { data: invoiceData } = await supabase
          .from("invoices")
          .select("id, invoice_number, issue_date, total, amount_paid, amount_due, status, due_date")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
        setProjectInvoices(
          (invoiceData || []).map((inv: any) => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            issue_date: inv.issue_date || "",
            total: Number(inv.total) || 0,
            amount_paid: Number(inv.amount_paid) || 0,
            amount_due: Number(inv.amount_due) || 0,
            status: inv.status || "draft",
            due_date: inv.due_date || "",
          }))
        )

        // Map project_files from the joined query
        setProjectFiles(
          (projectData.project_files || []).map((f: any) => ({
            id: f.id,
            name: f.name || "Unnamed File",
            type: (f.type?.startsWith("image/") ? "image" : f.type === "application/pdf" ? "pdf" : "document") as "pdf" | "image" | "document",
            size: f.size || "",
            uploadedBy: f.uploaded_by || "",
            uploadedAt: f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : "",
            version: f.version || undefined,
            url: f.url,
          }))
        )
      }
    } catch (error: any) {
      console.error("Error loading project:", error)
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate overall progress
  const totalTasks = todos.length
  const completedTasks = todos.filter((t) => t.completed).length
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Toggle functions
  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              completedBy: !todo.completed ? currentUser : undefined,
              completedAt: !todo.completed ? new Date().toISOString() : undefined,
            }
          : todo
      )
    )
  }

  const toggleSubtask = (todoId: string, subtaskId: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: todo.subtasks.map((sub) =>
                sub.id === subtaskId
                  ? {
                      ...sub,
                      completed: !sub.completed,
                      completedBy: !sub.completed ? currentUser : undefined,
                      completedAt: !sub.completed ? new Date().toISOString() : undefined,
                    }
                  : sub
              ),
            }
          : todo
      )
    )
  }

  const toggleExpandTodo = (id: string) => {
    setExpandedTodos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const addTodo = () => {
    if (!newTodoTitle.trim()) return

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: newTodoTitle,
      completed: false,
      assignedTo: newTodoAssignee || undefined,
      dueDate: newTodoDueDate || undefined,
      priority: newTodoPriority,
      subtasks: [],
      notes: [],
      timeEntries: [],
      attachments: [],
    }

    setTodos((prev) => [...prev, newTodo])
    setNewTodoTitle("")
    setNewTodoAssignee("")
    setNewTodoDueDate("")
    setNewTodoPriority("medium")
    setIsAddTodoOpen(false)
  }

  const addSubtask = (todoId: string, title: string) => {
    if (!title.trim()) return

    const newSubtask: TodoSubtask = {
      id: `${todoId}-${Date.now()}`,
      title: title,
      completed: false,
    }

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? { ...todo, subtasks: [...todo.subtasks, newSubtask] }
          : todo
      )
    )
  }

  const addInlineSubtask = (todoId: string) => {
    if (!newInlineSubtaskTitle.trim()) return

    addSubtask(todoId, newInlineSubtaskTitle)
    setNewInlineSubtaskTitle("")
    setAddingSubtaskForTodo(null)
  }

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
    if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
    return "just now"
  }

  const openTaskDetail = (task: Todo) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
    setTaskDetailTab("overview")
  }

  const addTaskNote = (content: string) => {
    if (!selectedTask || !content.trim()) return

    const newTaskNote: TaskNote = {
      id: `note-${Date.now()}`,
      author: currentUser,
      content: content,
      timestamp: "just now",
    }

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === selectedTask.id
          ? { ...todo, notes: [...todo.notes, newTaskNote] }
          : todo
      )
    )
    setSelectedTask({
      ...selectedTask,
      notes: [...selectedTask.notes, newTaskNote],
    })
  }

  const addTimeEntry = (todoId: string, duration: number, notes: string) => {
    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      user: currentUser,
      duration: duration,
      date: new Date().toISOString(),
      notes: notes,
    }
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? { ...todo, timeEntries: [...todo.timeEntries, newEntry] }
          : todo
      )
    )
    // Update selected task
    if (selectedTask && selectedTask.id === todoId) {
      setSelectedTask({
        ...selectedTask,
        timeEntries: [...selectedTask.timeEntries, newEntry],
      })
    }
  }

  const performDelete = async (fileId: string) => {
    try {
      const res = await fetch(`/api/projects/files?fileId=${encodeURIComponent(fileId)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete file")
      }
      toast.success("File deleted")
      setProjectFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch (err: any) {
      toast.error(err.message || "Failed to delete file")
    }
  }

  const handleDeleteClick = (fileId: string, fileName: string) => {
    const suppressUntil = localStorage.getItem("af-suppress-delete-confirm")
    if (suppressUntil && Number(suppressUntil) > Date.now()) {
      performDelete(fileId)
      return
    }
    setDeleteConfirm({ id: fileId, name: fileName })
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    if (suppressDeleteWarning) {
      localStorage.setItem("af-suppress-delete-confirm", String(Date.now() + 3600000))
    }
    performDelete(deleteConfirm.id)
    setDeleteConfirm(null)
    setSuppressDeleteWarning(false)
  }

  const openSiteImageModal = () => {
    if (!project.location) return
    setSiteImageGenStep("options")
    setSiteImageGenError("")
    setSiteImageGenUrls([])
  }

  const generateSiteImage = async (enhanceMode: EnhanceMode) => {
    if (!project.location) return
    setIsGeneratingSiteImage(true)
    setSiteImageGenStep("fetching")
    setSiteImageGenError("")
    setSiteImageGenUrls([])

    // Simulate step progression while API runs
    const enhanceTimer = enhanceMode !== "original"
      ? setTimeout(() => setSiteImageGenStep("enhancing"), 3000)
      : null

    try {
      const res = await fetch("/api/projects/generate-site-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, address: project.location, enhanceMode }),
      })
      if (enhanceTimer) clearTimeout(enhanceTimer)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")

      setSiteImageGenStep("saving")
      // Brief pause on "saving" then show done
      await new Promise((resolve) => setTimeout(resolve, 800))
      const urls = data.files?.map((f: any) => f.url).filter(Boolean) ?? (data.url ? [data.url] : [])
      setSiteImageGenUrls(urls)
      setSiteImageGenStep("done")
      // Auto-dismiss after 2.5s and reload data
      setTimeout(() => {
        setSiteImageGenStep(null)
        setIsGeneratingSiteImage(false)
      }, 2500)
      await loadProjectData()
      // Refresh workspace to update credit counters
      refreshWorkspaces()
    } catch (err: any) {
      if (enhanceTimer) clearTimeout(enhanceTimer)
      console.error("[ProjectDetail] Site image generation failed:", err)
      setSiteImageGenError(err.message)
      setSiteImageGenStep("error")
      setIsGeneratingSiteImage(false)
    }
  }

  const uploadTaskAttachment = (todoId: string, fileName: string, fileSize: string, fileType: "pdf" | "image" | "document") => {
    const newAttachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: fileName,
      size: fileSize,
      type: fileType,
      uploadedBy: currentUser,
      uploadedAt: "just now",
    }
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? { ...todo, attachments: [...todo.attachments, newAttachment] }
          : todo
      )
    )
    // Update selected task
    if (selectedTask && selectedTask.id === todoId) {
      setSelectedTask({
        ...selectedTask,
        attachments: [...selectedTask.attachments, newAttachment],
      })
    }
  }

  // Drag and drop for subtasks
  const onSubtaskDragEnd = (result: DropResult, todoId: string) => {
    if (!result.destination) return

    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== todoId) return todo

        const newSubtasks = Array.from(todo.subtasks)
        const [removed] = newSubtasks.splice(result.source.index, 1)
        newSubtasks.splice(result.destination!.index, 0, removed)

        return { ...todo, subtasks: newSubtasks }
      })
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-sm text-[--af-text-secondary]">Loading project...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="bg-[--af-danger-bg] border border-[--af-danger-border] rounded-lg p-4">
          <p className="text-sm text-[--af-danger-text]">Error loading project: {loadError}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={loadProjectData}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Compute image files for gallery and lightbox
  const imageFiles = projectFiles
    .filter((f) => f.type === "image" && f.url)
    .map((f) => ({ id: f.id, name: f.name, url: f.url! }))
  const hasImages = imageFiles.length > 0

  // Lightbox images include all image files
  const lightboxImages = imageFiles.map((f) => ({ url: f.url, name: f.name }))

  return (
    <>
      {/* Main Content */}
      <div className="p-4 lg:p-6">
        <div className={`grid gap-6 max-w-[1800px] mx-auto ${
          hasImages
            ? "grid-cols-1 lg:grid-cols-3 xl:grid-cols-[280px_1fr_1fr_1fr]"
            : "grid-cols-1 lg:grid-cols-3"
        }`}>
          {/* Image Gallery Column (xl+ only, when images exist) */}
          {hasImages && (
            <div className="hidden xl:block xl:col-span-1">
              <ProjectImageGallery
                images={imageFiles}
                selectedIndex={selectedImageIndex}
                onImageSelect={(index) => setSelectedImageIndex(index)}
                onFullscreen={() => {
                  setLightboxOpen(true)
                }}
              />
            </div>
          )}
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Summary Card */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project Summary
              </h2>
              <p className="text-sm text-[--af-text-secondary] mb-6">
                {project.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Start Date</p>
                  <p className="text-sm font-medium">
                    {new Date(project.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Expected</p>
                  <p className="text-sm font-medium">
                    {new Date(project.expectedCompletion).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Due Date</p>
                  <p className="text-sm font-medium">
                    {new Date(project.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Payment</p>
                  <Badge className={paymentColors[project.paymentStatus]}>
                    {project.paymentStatus}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[--af-border-default]">
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Budget</p>
                  <p className="text-sm font-medium">
                    ${project.budget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Spent</p>
                  <p className="text-sm font-medium">
                    ${project.spent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Time Logged</p>
                  <p className="text-sm font-medium">{project.timeLogged}</p>
                </div>
                <div>
                  <p className="text-xs text-[--af-text-muted] mb-1">Files</p>
                  <p className="text-sm font-medium">{projectFiles.length}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[--af-border-default]">
                <p className="text-xs text-[--af-text-muted] mb-2">Team Members</p>
                <div className="flex items-center gap-2">
                  {project.assignedTeam.map((member, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-[--af-bg-surface-alt] dark:bg-warm-800 text-xs">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-[--af-text-muted]">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lead-Origin Details (only shown if project has lead data) */}
            {(project.source || project.interest || project.painPoints || project.notes || project.temperature || project.industry || project.companyName || project.leadId) && (
              <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Lead Details
                  {project.leadId && (
                    <Badge className="ml-2 bg-purple-500/10 text-purple-600 border-purple-500/20 border text-xs">
                      From Lead
                    </Badge>
                  )}
                </h2>

                {/* Status row */}
                {(project.temperature || project.leadScore !== null) && (
                  <div className="flex items-center gap-3 mb-4">
                    {project.temperature && (
                      <Badge className={`${temperatureStyles[project.temperature] || "bg-[--af-bg-surface-alt] text-[--af-text-secondary]"} border capitalize`}>
                        {project.temperature}
                      </Badge>
                    )}
                    {project.leadScore !== null && project.leadScore !== undefined && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[--af-text-muted]" />
                        <span className="text-sm">Score: <span className="font-medium">{project.leadScore}</span>/100</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-3">
                    {project.source && (
                      <div>
                        <p className="text-xs text-[--af-text-muted]">Lead Source</p>
                        <p className="text-sm font-medium">{sourceLabels[project.source] || project.source}</p>
                      </div>
                    )}
                    {project.interest && (
                      <div>
                        <p className="text-xs text-[--af-text-muted]">Interest / Service</p>
                        <p className="text-sm font-medium">{project.interest}</p>
                      </div>
                    )}
                    {project.companyName && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-[--af-text-muted] mt-0.5" />
                        <div>
                          <p className="text-xs text-[--af-text-muted]">Company</p>
                          <p className="text-sm font-medium">{project.companyName}</p>
                        </div>
                      </div>
                    )}
                    {project.jobTitle && (
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 text-[--af-text-muted] mt-0.5" />
                        <div>
                          <p className="text-xs text-[--af-text-muted]">Job Title</p>
                          <p className="text-sm font-medium">{project.jobTitle}</p>
                        </div>
                      </div>
                    )}
                    {(project.budgetMin !== null || project.budget > 0) && project.budgetMin !== null && (
                      <div>
                        <p className="text-xs text-[--af-text-muted]">Budget Range</p>
                        <p className="text-sm font-medium">
                          ${(project.budgetMin || 0).toLocaleString()} - ${(project.budget || 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right column */}
                  <div className="space-y-3">
                    {project.industry && (
                      <div>
                        <p className="text-xs text-[--af-text-muted]">Industry</p>
                        <p className="text-sm font-medium">{project.industry}</p>
                      </div>
                    )}
                    {project.companySize && (
                      <div>
                        <p className="text-xs text-[--af-text-muted]">Company Size</p>
                        <p className="text-sm font-medium">{project.companySize}</p>
                      </div>
                    )}
                    {project.location && (
                      <div>
                        <p className="text-xs text-[--af-text-muted]">Location</p>
                        <p className="text-sm font-medium">{project.location}</p>
                      </div>
                    )}
                    {project.nextAction && (
                      <div>
                        <p className="text-xs text-[--af-text-muted]">Next Action</p>
                        <p className="text-sm font-medium">{project.nextAction}</p>
                        {project.nextActionDate && (
                          <p className="text-xs text-[--af-text-muted]">
                            Due: {new Date(project.nextActionDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pain points and notes */}
                {project.painPoints && (
                  <div className="mt-4 pt-4 border-t border-[--af-border-default]">
                    <p className="text-xs text-[--af-text-muted] mb-1">Pain Points</p>
                    <p className="text-sm text-[--af-text-secondary] dark:text-[--af-text-muted] whitespace-pre-wrap">{project.painPoints}</p>
                  </div>
                )}
                {project.notes && (
                  <div className="mt-4 pt-4 border-t border-[--af-border-default]">
                    <p className="text-xs text-[--af-text-muted] mb-1">Lead Notes</p>
                    <p className="text-sm text-[--af-text-secondary] dark:text-[--af-text-muted] whitespace-pre-wrap">{project.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Overall Progress Section */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Overall Progress
                </h2>
                <span className="text-3xl font-display font-bold tracking-tight">{overallProgress}%</span>
              </div>
              <div className="h-3 bg-[--af-bg-surface-alt] rounded-full overflow-hidden">
                <div
                  className="h-full bg-warm-900 dark:bg-[--af-bg-surface] rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-sm text-[--af-text-secondary] mt-2">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>

            {/* Tasks & Todos Section */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Tasks & Todos
                </h2>
                <Button size="sm" onClick={() => setIsAddTodoOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {todos.length === 0 ? (
                <div className="py-8">
                  <p className="text-center text-sm text-[--af-text-muted]">
                    No tasks yet. Add your first todo to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="border border-[--af-border-default] rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium cursor-pointer hover:underline ${
                                todo.completed
                                  ? "line-through text-[--af-text-muted]"
                                  : ""
                              }`}
                              onClick={() => openTaskDetail(todo)}
                            >
                              {todo.title}
                            </p>
                            {todo.completed && todo.completedBy && (
                              <p className="text-xs text-[--af-text-muted] mt-1">
                                Completed by {todo.completedBy}
                                {todo.completedAt && ` • ${getRelativeTime(todo.completedAt)}`}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {todo.priority && (
                                <Badge
                                  variant="outline"
                                  className={`${priorityColors[todo.priority]} text-xs`}
                                >
                                  {todo.priority}
                                </Badge>
                              )}
                              {todo.assignedTo && (
                                <span className="text-xs text-[--af-text-muted]">
                                  Assigned to {workspaceMembers.find(m => m.userId === todo.assignedTo)?.name || todo.assignedTo}
                                </span>
                              )}
                              {todo.dueDate && (
                                <span className="text-xs text-[--af-text-muted] flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(todo.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {todo.subtasks.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => toggleExpandTodo(todo.id)}
                            >
                              {expandedTodos.has(todo.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Subtasks - Always show add subtask option */}
                        <div className="mt-3 space-y-2">
                          {(expandedTodos.has(todo.id) || todo.subtasks.length === 0) && (
                            <DragDropContext onDragEnd={(result) => onSubtaskDragEnd(result, todo.id)}>
                              <Droppable droppableId={`subtasks-${todo.id}`}>
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                  >
                                    {todo.subtasks.map((subtask, index) => (
                                      <Draggable
                                        key={subtask.id}
                                        draggableId={subtask.id}
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`flex items-start gap-2 pl-4 group ${
                                              snapshot.isDragging ? "opacity-50" : ""
                                            }`}
                                          >
                                            <div
                                              {...provided.dragHandleProps}
                                              className="opacity-0 group-hover:opacity-100 transition-opacity pt-1 cursor-grab active:cursor-grabbing"
                                            >
                                              <GripVertical className="w-4 h-4 text-[--af-text-muted]" />
                                            </div>
                                            <Checkbox
                                              checked={subtask.completed}
                                              onCheckedChange={() =>
                                                toggleSubtask(todo.id, subtask.id)
                                              }
                                              className="mt-1"
                                            />
                                            <div className="flex-1">
                                              <p
                                                className={`text-sm ${
                                                  subtask.completed
                                                    ? "line-through text-[--af-text-muted]"
                                                    : ""
                                                }`}
                                              >
                                                {subtask.title}
                                              </p>
                                              {subtask.completed && subtask.completedBy && (
                                                <p className="text-xs text-[--af-text-muted] mt-0.5">
                                                  Completed by {subtask.completedBy}
                                                  {subtask.completedAt &&
                                                    ` • ${getRelativeTime(subtask.completedAt)}`}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Inline Add Subtask */}
                                    {addingSubtaskForTodo === todo.id ? (
                                      <div className="flex items-center gap-2 pl-10">
                                        <Input
                                          value={newInlineSubtaskTitle}
                                          onChange={(e) =>
                                            setNewInlineSubtaskTitle(e.target.value)
                                          }
                                          placeholder="Subtask title..."
                                          className="h-8 text-sm"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              addInlineSubtask(todo.id)
                                            } else if (e.key === "Escape") {
                                              setAddingSubtaskForTodo(null)
                                              setNewInlineSubtaskTitle("")
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => addInlineSubtask(todo.id)}
                                          className="h-8"
                                        >
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setAddingSubtaskForTodo(todo.id)}
                                        className="flex items-center gap-2 pl-10 text-sm text-[--af-text-secondary] hover:text-foreground dark:hover:text-white transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Add a subtask
                                      </button>
                                    )}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Notes & Comments
                </h2>
              </div>

              {projectNotes.length === 0 ? (
                <div className="py-8 mb-6">
                  <p className="text-center text-sm text-[--af-text-muted]">
                    No notes yet. Add notes to document your progress.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {projectNotes.map((note) => (
                  <div key={note.id} className="flex gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={note.avatar} />
                      <AvatarFallback className="bg-[--af-bg-surface-alt] dark:bg-warm-800">
                        {note.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{note.author}</p>
                        <span className="text-xs text-[--af-text-muted]">{note.timestamp}</span>
                      </div>
                      <p className="text-sm text-[--af-text-secondary]">
                        {note.content}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              )}

              {/* Add Note Form */}
              <div className="border-t border-[--af-border-default] pt-4">
                <Textarea
                  placeholder="Add a note or comment..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="mb-2 min-h-[80px] resize-none"
                />
                <div className="flex justify-end">
                  <Button size="sm" disabled={!newNote.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </div>
            </div>

            {/* Files & Attachments Section */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Files & Attachments
                </h2>
                <div className="flex items-center gap-2">
                  {project.location && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openSiteImageModal}
                      disabled={isGeneratingSiteImage}
                    >
                      {isGeneratingSiteImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Site Images
                        </>
                      )}
                    </Button>
                  )}
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </div>

              {projectFiles.length === 0 ? (
                <div className="py-8">
                  <p className="text-center text-sm text-[--af-text-muted]">
                    No files attached. Upload project files and documents.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projectFiles.map((file) => {
                    const imageIndex = file.type === "image" && file.url
                      ? imageFiles.findIndex((img) => img.id === file.id)
                      : -1
                    return (
                      <div
                        key={file.id}
                        className={`border border-[--af-border-default] rounded-lg p-4 hover:shadow-md transition-shadow ${
                          imageIndex >= 0 ? "cursor-pointer" : ""
                        }`}
                        onClick={imageIndex >= 0 ? () => {
                          setSelectedImageIndex(imageIndex)
                          setLightboxOpen(true)
                        } : undefined}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 bg-[--af-bg-surface-alt] rounded flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
                            {file.type === "image" && file.url ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded flex items-center justify-center">
                                  <Expand className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </>
                            ) : (
                              <File className="w-5 h-5 text-[--af-text-secondary]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-[--af-text-muted]">
                              <span>{file.size}</span>
                              <span>•</span>
                              <span>{file.uploadedAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {file.url ? (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.name}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </a>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[--af-text-muted] hover:text-[--af-danger-text]"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(file.id, file.name)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Invoices Section */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Invoices
                </h2>
                <a href={`/invoices/new?projectId=${projectId}&projectName=${encodeURIComponent(project.title)}`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                </a>
              </div>

              {projectInvoices.length === 0 ? (
                <div className="py-8">
                  <p className="text-center text-sm text-[--af-text-muted]">
                    No invoices created for this project.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {projectInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border border-[--af-border-default] rounded-lg p-4 cursor-pointer hover:bg-[--af-bg-surface-alt] transition-colors"
                    onClick={() => window.location.href = `/invoices`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-[--af-text-muted]">
                          {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Badge className={invoiceStatusColors[invoice.status] || invoiceStatusColors.draft}>
                          {invoice.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[--af-border-default]">
                    <div className="flex justify-between text-sm">
                      <span className="text-[--af-text-secondary]">Total Invoiced</span>
                      <span className="font-semibold">${projectInvoices.reduce((s, i) => s + i.total, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-[--af-text-secondary]">Total Paid</span>
                      <span className="font-semibold text-[--af-success-text]">${projectInvoices.reduce((s, i) => s + i.amount_paid, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-[--af-text-secondary]">Outstanding</span>
                      <span className="font-semibold text-[--af-warning-text]">${projectInvoices.reduce((s, i) => s + i.amount_due, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Contracts Section */}
            <ProjectContractsSection projectId={projectId} />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Info Card */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6 lg:sticky lg:top-6">
              <h3 className="font-semibold mb-4">Client Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[--af-text-muted] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{project.client.name}</p>
                    <p className="text-xs text-[--af-text-muted]">Primary Contact</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[--af-text-muted] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm">{project.client.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[--af-text-muted] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm">{project.client.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm">{project.client.address}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Contact Client
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex gap-3 text-sm">
                  <Clock className="w-4 h-4 text-[--af-text-muted] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Task completed</p>
                    <p className="text-xs text-[--af-text-muted]">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <Clock className="w-4 h-4 text-[--af-text-muted] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">File uploaded</p>
                    <p className="text-xs text-[--af-text-muted]">3 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <Clock className="w-4 h-4 text-[--af-text-muted] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Note added</p>
                    <p className="text-xs text-[--af-text-muted]">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Todo Modal */}
      <Dialog open={isAddTodoOpen} onOpenChange={setIsAddTodoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Task Title</label>
              <Input
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="Enter task title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Assign To</label>
              <Select value={newTodoAssignee} onValueChange={setNewTodoAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {workspaceMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-[10px]">
                            {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <Input
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={newTodoPriority} onValueChange={(v: any) => setNewTodoPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTodoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTodo} disabled={!newTodoTitle.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Site Image Generation Modal */}
      <SiteImageGenerationModal
        step={siteImageGenStep}
        errorMessage={siteImageGenError}
        generatedImageUrls={siteImageGenUrls}
        onDismiss={() => {
          setSiteImageGenStep(null)
          setIsGeneratingSiteImage(false)
        }}
        onStart={generateSiteImage}
        creditsRemaining={creditsRemaining}
        creditsLimit={aiCreditsLimit}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={selectedImageIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTask.completed}
                  onCheckedChange={() => toggleTodo(selectedTask.id)}
                />
                <span className={selectedTask.completed ? "line-through text-[--af-text-muted]" : ""}>
                  {selectedTask.title}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Description */}
              {selectedTask.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <p className="text-sm text-[--af-text-secondary]">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Notes ({selectedTask.notes.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTask.notes.map((note) => (
                    <div key={note.id} className="text-sm border-l-2 border-[--af-border-default] pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{note.author}</span>
                        <span className="text-xs text-[--af-text-muted]">{note.timestamp}</span>
                      </div>
                      <p className="text-[--af-text-secondary]">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Entries */}
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Time Entries ({selectedTask.timeEntries.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTask.timeEntries.map((entry) => (
                    <div key={entry.id} className="text-sm flex justify-between items-start">
                      <div>
                        <p className="font-medium">{entry.user}</p>
                        <p className="text-xs text-[--af-text-muted]">{entry.notes}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{entry.duration} min</p>
                        <p className="text-xs text-[--af-text-muted]">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  Attachments ({selectedTask.attachments.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTask.attachments.map((att) => (
                    <div key={att.id} className="text-sm flex items-center gap-2">
                      <File className="w-4 h-4 text-[--af-text-muted]" />
                      <div className="flex-1">
                        <p className="font-medium">{att.name}</p>
                        <p className="text-xs text-[--af-text-muted]">
                          {att.size} • {att.uploadedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) { setDeleteConfirm(null); setSuppressDeleteWarning(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Checkbox id="suppress-delete" checked={suppressDeleteWarning} onCheckedChange={(checked) => setSuppressDeleteWarning(!!checked)} />
            <label htmlFor="suppress-delete" className="text-sm text-[--af-text-muted] cursor-pointer">
              Don&apos;t warn me about deleting files for the next hour
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirm(null); setSuppressDeleteWarning(false) }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
