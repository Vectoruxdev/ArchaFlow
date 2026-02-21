"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  MoreVertical,
  Archive,
  Edit,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  User,
  Building2,
  Calendar,
  Target,
  ArrowRightCircle,
  PhoneCall,
  MailOpen,
  CalendarCheck,
  StickyNote,
  Clock,
  TrendingUp,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { CityCombobox } from "@/components/ui/city-combobox"
import { LeadScoreSlider } from "@/components/leads/lead-score-slider"
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
import { AppLayout } from "@/components/layout/app-layout"
import { LeadFormModal, type LeadFormData } from "@/components/leads/lead-form-modal"
import { LogActivityModal, type ActivityFormData } from "@/components/leads/log-activity-modal"
import { authFetch } from "@/lib/auth/auth-fetch"
import { toast } from "@/lib/toast"
import { supabase } from "@/lib/supabase/client"
import { recordActivity } from "@/lib/activity"
import { useAuth } from "@/lib/auth/auth-context"

interface LeadDetail {
  id: string
  uniqueCustomerIdentifier: string
  leadTypeId: string | null
  leadTypeName: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  jobTitle: string
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
  clientId: string | null
  projectId: string | null
  convertedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Activity {
  id: string
  activityType: string
  subject: string
  description: string
  callDuration: number | null
  callOutcome: string | null
  userId: string | null
  userEmail?: string
  createdAt: string
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

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
}

const temperatureOptions = [
  { value: "cold", label: "Cold" },
  { value: "warm", label: "Warm" },
  { value: "hot", label: "Hot" },
]

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
]

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
]

const sourceOptions = [
  { value: "website_form", label: "Website Form" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "social_media", label: "Social Media" },
  { value: "referral", label: "Referral" },
  { value: "cold_call", label: "Cold Call" },
  { value: "ad", label: "Advertisement" },
  { value: "trade_show", label: "Trade Show" },
  { value: "other", label: "Other" },
]

const activityIcons: Record<string, any> = {
  call: PhoneCall,
  email: MailOpen,
  meeting: CalendarCheck,
  note: StickyNote,
  status_change: TrendingUp,
}

function TemperatureBadge({ temperature }: { temperature: string }) {
  const styles: Record<string, string> = {
    cold: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
    warm: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
    hot: "bg-[--af-danger-bg]0/10 text-[--af-danger-text] border-[--af-danger-border]/20",
  }
  return (
    <Badge className={`${styles[temperature] || "bg-[--af-bg-surface-alt] text-[--af-text-secondary]"} border`}>
      {temperature.charAt(0).toUpperCase() + temperature.slice(1)}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    contacted: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
    qualified: "bg-[--af-success-bg]0/10 text-[--af-success-text] border-[--af-success-border]/20",
    proposal: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    negotiation: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
    won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    lost: "bg-[--af-bg-canvas]0/10 text-[--af-text-muted] border-[--af-border-default]",
  }
  return (
    <Badge className={`${styles[status] || "bg-[--af-bg-surface-alt] text-[--af-text-secondary]"} border`}>
      {statusLabels[status] || status}
    </Badge>
  )
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentWorkspace, user } = useAuth()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false)
  const [logActivityType, setLogActivityType] = useState("call")
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [workspaceUsers, setWorkspaceUsers] = useState<{ id: string; email: string; name?: string }[]>([])
  const [leadTypes, setLeadTypes] = useState<{ id: string; label: string }[]>([])

  const [editingSection, setEditingSection] = useState<"contact" | "details" | null>(null)
  const [contactEditForm, setContactEditForm] = useState({
    uniqueCustomerIdentifier: "",
    leadTypeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    address: "",
    city: "",
    state: "",
  })
  const [detailsEditForm, setDetailsEditForm] = useState({
    source: "",
    interest: "",
    painPoints: "",
    budget: "",
    squareFootage: "",
    costPerSqft: "",
    discountType: "",
    discountValue: "",
    notes: "",
  })

  const businessId = currentWorkspace?.id

  const canEditLead =
    !!lead &&
    !lead.convertedAt &&
    !lead.archivedAt &&
    (currentWorkspace?.role === "owner" ||
      currentWorkspace?.role === "admin" ||
      currentWorkspace?.role === "editor")

  useEffect(() => {
    loadLead()
    loadActivities()
    if (businessId) {
      loadWorkspaceUsers()
      loadLeadTypes()
    }
  }, [params.id, businessId])

  // Auto-open convert dialog if ?convert=true
  useEffect(() => {
    if (searchParams.get("convert") === "true" && lead && !lead.convertedAt) {
      setIsConvertDialogOpen(true)
    }
  }, [searchParams, lead])

  const loadLead = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error) throw error

      if (data) {
        setLead({
          id: data.id,
          uniqueCustomerIdentifier: data.unique_customer_identifier || "",
          leadTypeId: data.lead_type_id || null,
          leadTypeName: null, // resolved when leadTypes load
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email || "",
          phone: data.phone || "",
          companyName: data.company_name || "",
          jobTitle: data.job_title || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          source: data.source || "other",
          interest: data.interest || "",
          painPoints: data.pain_points || "",
          budget: data.budget ?? null,
          squareFootage: data.square_footage ?? null,
          costPerSqft: data.cost_per_sqft ?? null,
          discountType: data.discount_type ?? null,
          discountValue: data.discount_value ?? null,
          temperature: data.temperature || "cold",
          status: data.status || "new",
          leadScore: data.lead_score || 0,
          nextAction: data.next_action || "",
          nextActionDate: data.next_action_date,
          notes: data.notes || "",
          assignedTo: data.assigned_to,
          clientId: data.client_id,
          projectId: data.project_id,
          convertedAt: data.converted_at,
          archivedAt: data.archived_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        })
      }
    } catch (error: any) {
      console.error("Error loading lead:", error)
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", params.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setActivities(
        (data || []).map((a: any) => ({
          id: a.id,
          activityType: a.activity_type,
          subject: a.subject || "",
          description: a.description || "",
          callDuration: a.call_duration,
          callOutcome: a.call_outcome,
          userId: a.user_id,
          createdAt: a.created_at,
        }))
      )
    } catch (error: any) {
      console.error("Error loading activities:", error)
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
      const seen = new Set<string>()
      const dedupe = (arr: { id: string; email: string; name?: string }[]) =>
        arr.filter((u) => {
          if (seen.has(u.id)) return false
          seen.add(u.id)
          return true
        })
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

  // Resolve lead type name when leadTypes load
  useEffect(() => {
    if (lead && leadTypes.length > 0 && lead.leadTypeId && !lead.leadTypeName) {
      const label = leadTypes.find((lt) => lt.id === lead.leadTypeId)?.label || null
      setLead((prev) => (prev ? { ...prev, leadTypeName: label } : prev))
    }
  }, [lead, leadTypes])

  const archiveLead = async () => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", params.id)
      if (error) throw error
      router.push("/leads")
    } catch (error: any) {
      console.error("Error archiving lead:", error)
      toast.error("Failed to archive lead: " + error.message)
    }
  }

  const handleEditSave = async (formData: LeadFormData) => {
    if (!businessId) throw new Error("No workspace selected")

    const payload = {
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

    const { error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", params.id)

    if (error) throw error
    await loadLead()
  }

  const saveLeadField = async (
    field: "temperature" | "status" | "leadScore",
    value: string | number
  ) => {
    if (!lead) return
    const snakeMap: Record<string, string> = {
      temperature: "temperature",
      status: "status",
      leadScore: "lead_score",
    }
    const dbField = snakeMap[field]
    const dbValue =
      field === "leadScore"
        ? Math.max(0, Math.min(100, Number(value)))
        : value
    const prevValue = lead[field]

    setLead((prev) => (prev ? { ...prev, [field]: dbValue } : prev))

    const { error } = await supabase
      .from("leads")
      .update({ [dbField]: dbValue })
      .eq("id", params.id)

    if (error) {
      setLead((prev) => (prev ? { ...prev, [field]: prevValue } : prev))
      toast.error("Failed to save: " + error.message)
    }
  }

  const startEditContact = () => {
    if (!lead) return
    setContactEditForm({
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
    })
    setEditingSection("contact")
  }

  const startEditDetails = () => {
    if (!lead) return
    setDetailsEditForm({
      source: lead.source || "other",
      interest: lead.interest,
      painPoints: lead.painPoints,
      budget: lead.budget != null ? String(lead.budget) : "",
      squareFootage: lead.squareFootage != null ? String(lead.squareFootage) : "",
      costPerSqft: lead.costPerSqft != null ? String(lead.costPerSqft) : "",
      discountType: lead.discountType || "",
      discountValue: lead.discountValue != null ? String(lead.discountValue) : "",
      notes: lead.notes,
    })
    setEditingSection("details")
  }

  const saveSectionContact = async () => {
    if (!lead) return
    const payload = {
      unique_customer_identifier: contactEditForm.uniqueCustomerIdentifier.trim() || null,
      lead_type_id: contactEditForm.leadTypeId || null,
      first_name: contactEditForm.firstName.trim(),
      last_name: contactEditForm.lastName.trim(),
      email: contactEditForm.email.trim() || null,
      phone: contactEditForm.phone.trim() || null,
      company_name: contactEditForm.companyName.trim() || null,
      address: contactEditForm.address.trim() || null,
      city: contactEditForm.city.trim() || null,
      state: contactEditForm.state || null,
    }
    const { error } = await supabase.from("leads").update(payload).eq("id", params.id)
    if (error) {
      toast.error("Failed to save: " + error.message)
      return
    }
    setLead((prev) =>
      prev
        ? {
            ...prev,
            uniqueCustomerIdentifier: contactEditForm.uniqueCustomerIdentifier.trim(),
            leadTypeId: contactEditForm.leadTypeId || null,
            leadTypeName: contactEditForm.leadTypeId
              ? leadTypes.find((lt) => lt.id === contactEditForm.leadTypeId)?.label || null
              : null,
            firstName: contactEditForm.firstName.trim(),
            lastName: contactEditForm.lastName.trim(),
            email: contactEditForm.email.trim(),
            phone: contactEditForm.phone.trim(),
            companyName: contactEditForm.companyName.trim(),
            address: contactEditForm.address.trim(),
            city: contactEditForm.city.trim(),
            state: contactEditForm.state || "",
          }
        : prev
    )
    setEditingSection(null)
  }

  const saveSectionDetails = async () => {
    if (!lead) return
    const payload = {
      source: detailsEditForm.source || "other",
      interest: detailsEditForm.interest.trim() || null,
      pain_points: detailsEditForm.painPoints.trim() || null,
      budget: detailsEditForm.budget ? parseFloat(detailsEditForm.budget) : null,
      square_footage: detailsEditForm.squareFootage ? parseFloat(detailsEditForm.squareFootage) : null,
      cost_per_sqft: detailsEditForm.costPerSqft ? parseFloat(detailsEditForm.costPerSqft) : null,
      discount_type: detailsEditForm.discountType || null,
      discount_value: detailsEditForm.discountValue ? parseFloat(detailsEditForm.discountValue) : null,
      notes: detailsEditForm.notes.trim() || null,
    }
    const { error } = await supabase.from("leads").update(payload).eq("id", params.id)
    if (error) {
      toast.error("Failed to save: " + error.message)
      return
    }
    setLead((prev) =>
      prev
        ? {
            ...prev,
            source: detailsEditForm.source || "other",
            interest: detailsEditForm.interest.trim(),
            painPoints: detailsEditForm.painPoints.trim(),
            budget: detailsEditForm.budget ? parseFloat(detailsEditForm.budget) : null,
            squareFootage: detailsEditForm.squareFootage ? parseFloat(detailsEditForm.squareFootage) : null,
            costPerSqft: detailsEditForm.costPerSqft ? parseFloat(detailsEditForm.costPerSqft) : null,
            discountType: detailsEditForm.discountType || null,
            discountValue: detailsEditForm.discountValue ? parseFloat(detailsEditForm.discountValue) : null,
            notes: detailsEditForm.notes.trim(),
          }
        : prev
    )
    setEditingSection(null)
  }

  const cancelEditSection = () => setEditingSection(null)

  const handleLogActivity = async (data: ActivityFormData) => {
    if (!user) throw new Error("Not authenticated")

    const payload = {
      lead_id: params.id,
      user_id: user.id,
      activity_type: data.activityType,
      subject: data.subject.trim() || null,
      description: data.description.trim() || null,
      call_duration: data.callDuration ? parseInt(data.callDuration) * 60 : null, // minutes to seconds
      call_outcome: data.callOutcome || null,
    }

    const { error } = await supabase.from("lead_activities").insert([payload])
    if (error) throw error

    await loadActivities()
  }

  const handleConvertToProject = async () => {
    if (!lead || !businessId) return
    setIsConverting(true)

    try {
      // 1. Create a client from lead contact info (if no client_id exists)
      let clientId = lead.clientId

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert([{
            business_id: businessId,
            first_name: lead.firstName.trim(),
            last_name: lead.lastName.trim(),
            email: lead.email.trim() || null,
            phone: lead.phone.trim() || null,
            address: [lead.address, lead.city, lead.state].filter(Boolean).join(", ").trim() || null,
            description: lead.companyName ? [lead.companyName, lead.jobTitle].filter(Boolean).join(" - ") : null,
          }])
          .select()
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      // 2. Create the project with ALL lead data mapped
      const projectTitle = lead.interest || `${lead.firstName} ${lead.lastName} - ${lead.companyName || "Project"}`

      const sqft = lead.squareFootage ?? null
      const cost = lead.costPerSqft ?? null
      const total = sqft != null && cost != null && sqft > 0 && cost > 0 ? sqft * cost : null
      const discountType = lead.discountType || null
      const discountVal = lead.discountValue ?? null
      const discount = total != null && discountType && discountVal != null && discountVal > 0
        ? discountType === "percent"
          ? (total * discountVal) / 100
          : discountVal
        : 0
      const finalTotal = total != null ? total - discount : null
      const projectBudget = finalTotal ?? lead.budget ?? null

      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert([{
          business_id: businessId,
          title: projectTitle,
          client_id: clientId,
          client_name: `${lead.firstName} ${lead.lastName}`,
          client_email: lead.email || null,
          client_phone: lead.phone || null,
          client_address: [lead.address, lead.city, lead.state].filter(Boolean).join(", ").trim() || lead.address || null,
          status: "lead",
          description: lead.painPoints || null,
          // Lead-specific fields mapped to project
          source: lead.source || null,
          interest: lead.interest || null,
          pain_points: lead.painPoints || null,
          notes: lead.notes || null,
          budget: projectBudget,
          temperature: lead.temperature || null,
          lead_score: lead.leadScore || null,
          next_action: lead.nextAction || null,
          next_action_date: lead.nextActionDate || null,
          company_name: lead.companyName || null,
          job_title: lead.jobTitle || null,
          lead_id: lead.id,
        }])
        .select()
        .single()

      if (projectError) throw projectError

      // 2b. Create project_assignments for assigned_to (if the lead had an agent)
      if (lead.assignedTo) {
        await supabase.from("project_assignments").insert([{
          project_id: newProject.id,
          user_id: lead.assignedTo,
        }]).select()
      }

      // 3. Update the lead with conversion info
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          project_id: newProject.id,
          client_id: clientId,
          converted_at: new Date().toISOString(),
          status: "won",
        })
        .eq("id", lead.id)

      if (updateError) throw updateError

      // 4. Log the conversion as an activity
      await supabase.from("lead_activities").insert([{
        lead_id: lead.id,
        user_id: user?.id,
        activity_type: "status_change",
        subject: "Lead Converted to Project",
        description: `Converted to project "${projectTitle}"`,
      }])

      if (businessId) {
        recordActivity({
          businessId,
          userId: user?.id,
          activityType: "lead_converted",
          entityType: "project",
          entityId: newProject.id,
          message: `Lead "${lead.firstName} ${lead.lastName}" converted to project "${projectTitle}"`,
          metadata: { leadId: lead.id },
        }).catch(() => {})
      }

      // 5. Navigate to the new project
      setIsConvertDialogOpen(false)
      router.push(`/projects/${newProject.id}`)
    } catch (error: any) {
      console.error("Error converting lead:", error)
      toast.error("Failed to convert lead: " + error.message)
    } finally {
      setIsConverting(false)
    }
  }

  const openActivityModal = (type: string) => {
    setLogActivityType(type)
    setIsLogActivityOpen(true)
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/leads")
  }

  const editFormData: LeadFormData | null = lead
    ? {
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
      }
    : null

  const isConverted = !!lead?.convertedAt

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
                    <div className="text-[--af-danger-text]">Error loading lead</div>
                    <p className="text-sm text-[--af-text-muted] mt-1">{loadError}</p>
                  </div>
                ) : lead ? (
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight truncate">
                        {lead.firstName} {lead.lastName}
                      </h1>
                      <TemperatureBadge temperature={lead.temperature} />
                      <StatusBadge status={lead.status} />
                      {lead.archivedAt && (
                        <Badge className="bg-[--af-bg-canvas]0/10 text-[--af-text-secondary] border-[--af-border-default] border">
                          Archived
                        </Badge>
                      )}
                      {isConverted && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border">
                          Converted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[--af-text-muted] mt-1">
                      {lead.companyName && `${lead.companyName} · `}
                      Lead since {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                {!isConverted && (
                  <>
                    <Button
                      onClick={() => setIsConvertDialogOpen(true)}
                      disabled={!lead}
                    >
                      <ArrowRightCircle className="w-4 h-4 mr-2" />
                      Convert to Project
                    </Button>
                  </>
                )}
                {isConverted && lead?.projectId && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/projects/${lead.projectId}`)}
                  >
                    View Project
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!isConverted && (
                      <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Lead
                      </DropdownMenuItem>
                    )}
                    {!isConverted && (
                      <DropdownMenuItem onClick={() => setIsConvertDialogOpen(true)}>
                        <ArrowRightCircle className="w-4 h-4 mr-2" />
                        Convert to Project
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-orange-600"
                      onClick={archiveLead}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {lead && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Lead Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-bold">Contact Information</h2>
                    {canEditLead && (
                      editingSection === "contact" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditSection}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveSectionContact}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={startEditContact}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {editingSection === "contact" ? (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">First Name</p>
                              <Input
                                value={contactEditForm.firstName}
                                onChange={(e) =>
                                  setContactEditForm((p) => ({ ...p, firstName: e.target.value }))
                                }
                                placeholder="First name"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">Last Name</p>
                              <Input
                                value={contactEditForm.lastName}
                                onChange={(e) =>
                                  setContactEditForm((p) => ({ ...p, lastName: e.target.value }))
                                }
                                placeholder="Last name"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">Email</p>
                              <Input
                                type="email"
                                value={contactEditForm.email}
                                onChange={(e) =>
                                  setContactEditForm((p) => ({ ...p, email: e.target.value }))
                                }
                                placeholder="Email"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <PhoneIcon className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">Phone</p>
                              <Input
                                value={contactEditForm.phone}
                                onChange={(e) =>
                                  setContactEditForm((p) => ({ ...p, phone: e.target.value }))
                                }
                                placeholder="Phone"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">Unique Customer ID</p>
                              <Input
                                value={contactEditForm.uniqueCustomerIdentifier}
                                onChange={(e) =>
                                  setContactEditForm((p) => ({ ...p, uniqueCustomerIdentifier: e.target.value }))
                                }
                                placeholder="e.g., CUST-001"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">Lead Type</p>
                              <Select
                                value={contactEditForm.leadTypeId || "_none"}
                                onValueChange={(v) =>
                                  setContactEditForm((p) => ({ ...p, leadTypeId: v === "_none" ? "" : v }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select lead type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">Select lead type</SelectItem>
                                  {leadTypes.map((lt) => (
                                    <SelectItem key={lt.id} value={lt.id}>{lt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">Company</p>
                              <Input
                                value={contactEditForm.companyName}
                                onChange={(e) =>
                                  setContactEditForm((p) => ({ ...p, companyName: e.target.value }))
                                }
                                placeholder="Company"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">Address</p>
                              <Input
                                value={contactEditForm.address}
                                onChange={(e) =>
                                  setContactEditForm((p) => ({ ...p, address: e.target.value }))
                                }
                                placeholder="Address"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">City</p>
                              <CityCombobox
                                value={contactEditForm.city}
                                onChange={(v) =>
                                  setContactEditForm((p) => ({ ...p, city: v }))
                                }
                                placeholder="Search city..."
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <p className="text-sm text-[--af-text-muted]">State</p>
                              <SearchableSelect
                                options={US_STATES}
                                value={contactEditForm.state}
                                onValueChange={(v) =>
                                  setContactEditForm((p) => ({ ...p, state: v }))
                                }
                                placeholder="Select state"
                                searchPlaceholder="Search states..."
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">Full Name</p>
                              <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">Email</p>
                              <p className="font-medium">{lead.email || "---"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <PhoneIcon className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">Phone</p>
                              <p className="font-medium">{lead.phone || "---"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">Unique Customer ID</p>
                              <p className="font-medium">{lead.uniqueCustomerIdentifier || "---"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">Lead Type</p>
                              <p className="font-medium">{lead.leadTypeName || "---"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">Company</p>
                              <p className="font-medium">{lead.companyName || "---"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">Address</p>
                              <p className="font-medium">{lead.address || "---"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">City</p>
                              <p className="font-medium">{lead.city || "---"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-[--af-text-muted] mt-0.5" />
                            <div>
                              <p className="text-sm text-[--af-text-muted]">State</p>
                              <p className="font-medium">
                                {lead.state ? US_STATES.find((s) => s.value === lead.state)?.label || lead.state : "---"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-bold">Details</h2>
                    {canEditLead && (
                      editingSection === "details" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditSection}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveSectionDetails}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={startEditDetails}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )
                    )}
                  </div>
                  <div className="space-y-4">
                    {editingSection === "details" ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-sm text-[--af-text-muted]">Source</p>
                            <Select
                              value={detailsEditForm.source || "other"}
                              onValueChange={(v) =>
                                setDetailsEditForm((p) => ({ ...p, source: v }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                {sourceOptions.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-[--af-text-muted]">Service</p>
                            <Input
                              value={detailsEditForm.interest}
                              onChange={(e) =>
                                setDetailsEditForm((p) => ({ ...p, interest: e.target.value }))
                              }
                              placeholder="Service"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-[--af-text-muted]">Pain Points</p>
                          <Textarea
                            value={detailsEditForm.painPoints}
                            onChange={(e) =>
                              setDetailsEditForm((p) => ({ ...p, painPoints: e.target.value }))
                            }
                            placeholder="Pain points"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-[--af-text-muted]">Budget</p>
                          <Input
                            type="number"
                            value={detailsEditForm.budget}
                            onChange={(e) =>
                              setDetailsEditForm((p) => ({ ...p, budget: e.target.value }))
                            }
                            placeholder="Budget"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-sm text-[--af-text-muted]">Square Footage</p>
                            <Input
                              type="number"
                              value={detailsEditForm.squareFootage}
                              onChange={(e) =>
                                setDetailsEditForm((p) => ({ ...p, squareFootage: e.target.value }))
                              }
                              placeholder="Square footage"
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-[--af-text-muted]">Cost per Sq Ft</p>
                            <Input
                              type="number"
                              value={detailsEditForm.costPerSqft}
                              onChange={(e) =>
                                setDetailsEditForm((p) => ({ ...p, costPerSqft: e.target.value }))
                              }
                              placeholder="Cost per sq ft"
                            />
                          </div>
                        </div>
                        {(() => {
                          const sqft = parseFloat(detailsEditForm.squareFootage)
                          const cost = parseFloat(detailsEditForm.costPerSqft)
                          const total = !isNaN(sqft) && !isNaN(cost) && sqft > 0 && cost > 0 ? sqft * cost : null
                          const discountType = detailsEditForm.discountType || null
                          const discountVal = parseFloat(detailsEditForm.discountValue)
                          const discount = total != null && discountType && !isNaN(discountVal) && discountVal > 0
                            ? discountType === "percent"
                              ? (total * discountVal) / 100
                              : discountVal
                            : 0
                          const finalTotal = total != null ? total - discount : null
                          const hasDiscount = discount > 0
                          return (
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3 px-4 rounded-lg bg-[--af-bg-surface-alt]/50 border border-[--af-border-default]/50 dark:border-warm-800">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[--af-text-muted]">Total Price</span>
                                <span className="font-medium tabular-nums">
                                  {total != null ? `$${total.toLocaleString()}` : "---"}
                                  {hasDiscount && (
                                    <span className="text-xs text-[--af-text-muted] font-normal ml-1">
                                      (− {discountType === "percent" ? `${discountVal}%` : `$${discount.toLocaleString()}`})
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[--af-text-muted]">Discount</span>
                                <Select
                                  value={detailsEditForm.discountType || "_none"}
                                  onValueChange={(v) =>
                                    setDetailsEditForm((p) => ({ ...p, discountType: v === "_none" ? "" : v }))
                                  }
                                >
                                  <SelectTrigger className="w-[120px] h-9">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="_none">None</SelectItem>
                                    <SelectItem value="percent">Percent</SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  className="w-20 h-9"
                                  value={detailsEditForm.discountValue}
                                  onChange={(e) =>
                                    setDetailsEditForm((p) => ({ ...p, discountValue: e.target.value }))
                                  }
                                  placeholder={detailsEditForm.discountType === "percent" ? "10" : "5000"}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[--af-text-muted]">Final Total</span>
                                <span className="font-semibold tabular-nums">{finalTotal != null ? `$${finalTotal.toLocaleString()}` : "---"}</span>
                              </div>
                            </div>
                          )
                        })()}
                        <div className="space-y-2">
                          <p className="text-sm text-[--af-text-muted]">Notes</p>
                          <Textarea
                            value={detailsEditForm.notes}
                            onChange={(e) =>
                              setDetailsEditForm((p) => ({ ...p, notes: e.target.value }))
                            }
                            placeholder="Notes"
                            rows={4}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-[--af-text-muted]">Source</p>
                            <p className="font-medium">{sourceLabels[lead.source] || lead.source}</p>
                          </div>
                          <div>
                            <p className="text-sm text-[--af-text-muted]">Service</p>
                            <p className="font-medium">{lead.interest || "---"}</p>
                          </div>
                        </div>
                        {lead.painPoints && (
                          <div>
                            <p className="text-sm text-[--af-text-muted]">Pain Points</p>
                            <p className="text-sm text-[--af-text-secondary] dark:text-[--af-text-muted] mt-1">{lead.painPoints}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="text-sm text-[--af-text-muted]">Budget</p>
                          <p className="font-medium">
                            {lead.budget != null ? `$${lead.budget.toLocaleString()}` : "---"}
                          </p>
                        </div>
                        {(() => {
                          const sqft = lead.squareFootage ?? null
                          const cost = lead.costPerSqft ?? null
                          const total = sqft != null && cost != null && sqft > 0 && cost > 0 ? sqft * cost : null
                          const discountType = lead.discountType || null
                          const discountVal = lead.discountValue ?? null
                          const discount = total != null && discountType && discountVal != null && discountVal > 0
                            ? discountType === "percent"
                              ? (total * discountVal) / 100
                              : discountVal
                            : 0
                          const finalTotal = total != null ? total - discount : null
                          const hasDiscount = discount > 0
                          const hasPricing = (sqft != null || cost != null) || (discountType && discountVal != null && discountVal > 0)
                          return hasPricing ? (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <p className="text-sm text-[--af-text-muted]">Square Footage</p>
                                  <p className="font-medium">{sqft != null ? sqft.toLocaleString() : "---"}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-[--af-text-muted]">Cost per Sq Ft</p>
                                  <p className="font-medium">{cost != null ? `$${cost.toLocaleString()}` : "---"}</p>
                                </div>
                              </div>
                              {total != null && (
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 px-4 rounded-lg bg-[--af-bg-surface-alt]/50 border border-[--af-border-default]/50 dark:border-warm-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-[--af-text-muted]">Total Price</span>
                                    <span className="font-medium tabular-nums">
                                      ${total.toLocaleString()}
                                      {hasDiscount && (
                                        <span className="text-xs text-[--af-text-muted] font-normal ml-1">
                                          (− {discountType === "percent" ? `${discountVal}%` : `$${discount.toLocaleString()}`})
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  {finalTotal != null && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-[--af-text-muted]">Final Total</span>
                                      <span className="font-semibold tabular-nums">${finalTotal.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : null
                        })()}
                        {lead.notes && (
                          <div>
                            <p className="text-sm text-[--af-text-muted]">Notes</p>
                            <p className="text-sm text-[--af-text-secondary] dark:text-[--af-text-muted] mt-1 whitespace-pre-wrap">{lead.notes}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-bold">Activity Timeline</h2>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openActivityModal("call")}>
                        <PhoneCall className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openActivityModal("email")}>
                        <MailOpen className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openActivityModal("meeting")}>
                        <CalendarCheck className="w-4 h-4 mr-1" />
                        Meeting
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openActivityModal("note")}>
                        <StickyNote className="w-4 h-4 mr-1" />
                        Note
                      </Button>
                    </div>
                  </div>

                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-[--af-text-muted] mx-auto mb-2" />
                      <p className="text-sm text-[--af-text-muted]">No activity recorded yet.</p>
                      <p className="text-xs text-[--af-text-muted] mt-1">Log a call, email, meeting, or note to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {activities.map((activity, index) => {
                        const Icon = activityIcons[activity.activityType] || StickyNote
                        return (
                          <div key={activity.id} className="flex gap-4">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                activity.activityType === "call" ? "bg-[--af-success-bg]0/10 text-[--af-success-text]" :
                                activity.activityType === "email" ? "bg-[--af-info-bg]0/10 text-[--af-info-text]" :
                                activity.activityType === "meeting" ? "bg-purple-500/10 text-purple-600" :
                                activity.activityType === "status_change" ? "bg-orange-500/10 text-orange-600" :
                                "bg-[--af-bg-canvas]0/10 text-[--af-text-muted]"
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-px h-full bg-[--af-bg-surface-alt] dark:bg-warm-800 min-h-[24px]" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="pb-6 flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-sm">
                                    {activity.subject || activity.activityType.charAt(0).toUpperCase() + activity.activityType.slice(1)}
                                  </p>
                                  {activity.description && (
                                    <p className="text-sm text-[--af-text-secondary] mt-1 whitespace-pre-wrap">
                                      {activity.description}
                                    </p>
                                  )}
                                  {activity.activityType === "call" && (activity.callDuration || activity.callOutcome) && (
                                    <div className="flex gap-3 mt-1">
                                      {activity.callDuration && (
                                        <span className="text-xs text-[--af-text-muted]">
                                          Duration: {Math.round(activity.callDuration / 60)}m
                                        </span>
                                      )}
                                      {activity.callOutcome && (
                                        <span className="text-xs text-[--af-text-muted] capitalize">
                                          Outcome: {activity.callOutcome.replace("_", " ")}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-[--af-text-muted] shrink-0 ml-4">
                                  {new Date(activity.createdAt).toLocaleDateString()}{" "}
                                  {new Date(activity.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Status Sidebar */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                  <h2 className="text-lg font-display font-bold mb-4">Lead Status</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-[--af-text-muted]">Temperature</p>
                      <div className="mt-1">
                        {canEditLead ? (
                          <Select
                            value={lead.temperature}
                            onValueChange={(v) => saveLeadField("temperature", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {temperatureOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <TemperatureBadge temperature={lead.temperature} />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[--af-text-muted]">Status</p>
                      <div className="mt-1">
                        {canEditLead ? (
                          <Select
                            value={lead.status}
                            onValueChange={(v) => saveLeadField("status", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <StatusBadge status={lead.status} />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[--af-text-muted]">Lead Score</p>
                      <div className="mt-1">
                        {canEditLead ? (
                          <LeadScoreSlider
                            value={lead.leadScore}
                            onValueChange={(v) =>
                              setLead((prev) =>
                                prev ? { ...prev, leadScore: v } : prev
                              )
                            }
                            onValueCommit={(v) => saveLeadField("leadScore", v)}
                          />
                        ) : (
                          <LeadScoreSlider
                            value={lead.leadScore}
                            onValueChange={() => {}}
                            disabled
                          />
                        )}
                      </div>
                    </div>
                    {lead.assignedTo && (
                      <div>
                        <p className="text-sm text-[--af-text-muted]">Assigned To</p>
                        <p className="font-medium mt-1">
                          {workspaceUsers.find((u) => u.id === lead.assignedTo)?.name ||
                           workspaceUsers.find((u) => u.id === lead.assignedTo)?.email ||
                           "Unknown"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Action Card */}
                <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                  <h2 className="text-lg font-display font-bold mb-4">Next Action</h2>
                  {lead.nextAction ? (
                    <div className="space-y-2">
                      <p className="font-medium">{lead.nextAction}</p>
                      {lead.nextActionDate && (
                        <div className="flex items-center gap-2 text-sm text-[--af-text-muted]">
                          <Calendar className="w-4 h-4" />
                          {new Date(lead.nextActionDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[--af-text-muted] italic">No next action set.</p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                  <h2 className="text-lg font-display font-bold mb-4">Activity Stats</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold tracking-tight">
                        {activities.filter((a) => a.activityType === "call").length}
                      </p>
                      <p className="text-xs text-[--af-text-muted]">Calls</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold tracking-tight">
                        {activities.filter((a) => a.activityType === "email").length}
                      </p>
                      <p className="text-xs text-[--af-text-muted]">Emails</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold tracking-tight">
                        {activities.filter((a) => a.activityType === "meeting").length}
                      </p>
                      <p className="text-xs text-[--af-text-muted]">Meetings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold tracking-tight">
                        {activities.filter((a) => a.activityType === "note").length}
                      </p>
                      <p className="text-xs text-[--af-text-muted]">Notes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Lead Modal */}
        <LeadFormModal
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          lead={editFormData}
          onSave={handleEditSave}
          workspaceUsers={workspaceUsers}
          leadTypes={leadTypes}
        />

        {/* Log Activity Modal */}
        <LogActivityModal
          open={isLogActivityOpen}
          onOpenChange={setIsLogActivityOpen}
          defaultType={logActivityType}
          onSave={handleLogActivity}
          leadName={lead ? `${lead.firstName} ${lead.lastName}` : undefined}
        />

        {/* Convert to Project Dialog */}
        <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convert Lead to Project</DialogTitle>
              <DialogDescription>
                This will create a new project from this lead&apos;s information and mark the lead as converted.
              </DialogDescription>
            </DialogHeader>
            {lead && (
              <div className="space-y-3 py-2">
                <div className="bg-[--af-bg-surface-alt] rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-[--af-text-muted]">Lead:</span>{" "}
                    <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                  </p>
                  {lead.companyName && (
                    <p className="text-sm">
                      <span className="text-[--af-text-muted]">Company:</span>{" "}
                      <span className="font-medium">{lead.companyName}</span>
                    </p>
                  )}
                  {lead.interest && (
                    <p className="text-sm">
                      <span className="text-[--af-text-muted]">Service:</span>{" "}
                      <span className="font-medium">{lead.interest}</span>
                    </p>
                  )}
                  {(() => {
                    const sqft = lead.squareFootage ?? null
                    const cost = lead.costPerSqft ?? null
                    const total = sqft != null && cost != null && sqft > 0 && cost > 0 ? sqft * cost : null
                    const discountType = lead.discountType || null
                    const discountVal = lead.discountValue ?? null
                    const discount = total != null && discountType && discountVal != null && discountVal > 0
                      ? discountType === "percent"
                        ? (total * discountVal) / 100
                        : discountVal
                      : 0
                    const finalTotal = total != null ? total - discount : null
                    const displayBudget = finalTotal ?? lead.budget ?? null
                    return displayBudget != null ? (
                      <p className="text-sm">
                        <span className="text-[--af-text-muted]">Budget:</span>{" "}
                        <span className="font-medium">
                          ${displayBudget.toLocaleString()}
                        </span>
                      </p>
                    ) : null
                  })()}
                </div>
                <p className="text-sm text-[--af-text-muted]">
                  A new client and project will be created. The lead will be moved to the &quot;Converted&quot; tab.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsConvertDialogOpen(false)}
                disabled={isConverting}
              >
                Cancel
              </Button>
              <Button onClick={handleConvertToProject} disabled={isConverting}>
                {isConverting ? "Converting..." : "Convert to Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
