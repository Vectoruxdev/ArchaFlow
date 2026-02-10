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
  Briefcase,
  DollarSign,
  Calendar,
  Target,
  ArrowRightCircle,
  PhoneCall,
  MailOpen,
  CalendarCheck,
  StickyNote,
  Clock,
  TrendingUp,
} from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LeadFormModal, type LeadFormData } from "@/components/leads/lead-form-modal"
import { LogActivityModal, type ActivityFormData } from "@/components/leads/log-activity-modal"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

interface LeadDetail {
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

const activityIcons: Record<string, any> = {
  call: PhoneCall,
  email: MailOpen,
  meeting: CalendarCheck,
  note: StickyNote,
  status_change: TrendingUp,
}

function TemperatureBadge({ temperature }: { temperature: string }) {
  const styles: Record<string, string> = {
    cold: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    warm: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    hot: "bg-red-500/10 text-red-600 border-red-500/20",
  }
  return (
    <Badge className={`${styles[temperature] || "bg-gray-100 text-gray-600"} border`}>
      {temperature.charAt(0).toUpperCase() + temperature.slice(1)}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    contacted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    qualified: "bg-green-500/10 text-green-600 border-green-500/20",
    proposal: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    negotiation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    lost: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  }
  return (
    <Badge className={`${styles[status] || "bg-gray-100 text-gray-600"} border`}>
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

  const businessId = currentWorkspace?.id

  useEffect(() => {
    loadLead()
    loadActivities()
    if (businessId) loadWorkspaceUsers()
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
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email || "",
          phone: data.phone || "",
          companyName: data.company_name || "",
          jobTitle: data.job_title || "",
          address: data.address || "",
          source: data.source || "other",
          interest: data.interest || "",
          painPoints: data.pain_points || "",
          budgetMin: data.budget_min,
          budgetMax: data.budget_max,
          temperature: data.temperature || "cold",
          status: data.status || "new",
          leadScore: data.lead_score || 0,
          nextAction: data.next_action || "",
          nextActionDate: data.next_action_date,
          notes: data.notes || "",
          industry: data.industry || "",
          companySize: data.company_size || "",
          location: data.location || "",
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
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, users:user_id(email, raw_user_meta_data)")
        .eq("business_id", businessId)

      if (error) return

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
      alert("Failed to archive lead: " + error.message)
    }
  }

  const handleEditSave = async (formData: LeadFormData) => {
    if (!businessId) throw new Error("No workspace selected")

    const payload = {
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

    const { error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", params.id)

    if (error) throw error
    await loadLead()
  }

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
            address: lead.address.trim() || null,
            description: lead.companyName ? `${lead.companyName} - ${lead.jobTitle || ""}`.trim() : null,
          }])
          .select()
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      // 2. Create the project with ALL lead data mapped
      const projectTitle = lead.interest || `${lead.firstName} ${lead.lastName} - ${lead.companyName || "Project"}`

      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert([{
          business_id: businessId,
          title: projectTitle,
          client_id: clientId,
          client_name: `${lead.firstName} ${lead.lastName}`,
          client_email: lead.email || null,
          client_phone: lead.phone || null,
          client_address: lead.address || null,
          status: "lead",
          description: lead.painPoints || null,
          // Lead-specific fields mapped to project
          source: lead.source || null,
          interest: lead.interest || null,
          pain_points: lead.painPoints || null,
          notes: lead.notes || null,
          budget: lead.budgetMax || null,
          budget_min: lead.budgetMin || null,
          temperature: lead.temperature || null,
          lead_score: lead.leadScore || null,
          next_action: lead.nextAction || null,
          next_action_date: lead.nextActionDate || null,
          company_name: lead.companyName || null,
          job_title: lead.jobTitle || null,
          industry: lead.industry || null,
          company_size: lead.companySize || null,
          location: lead.location || null,
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

      // 5. Navigate to the new project
      setIsConvertDialogOpen(false)
      router.push(`/projects/${newProject.id}`)
    } catch (error: any) {
      console.error("Error converting lead:", error)
      alert("Failed to convert lead: " + error.message)
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
      }
    : null

  const isConverted = !!lead?.convertedAt

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {isLoading ? (
                  <div>
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2" />
                  </div>
                ) : loadError ? (
                  <div>
                    <div className="text-red-600">Error loading lead</div>
                    <p className="text-sm text-gray-500 mt-1">{loadError}</p>
                  </div>
                ) : lead ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold">
                        {lead.firstName} {lead.lastName}
                      </h1>
                      <TemperatureBadge temperature={lead.temperature} />
                      <StatusBadge status={lead.status} />
                      {lead.archivedAt && (
                        <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20 border">
                          Archived
                        </Badge>
                      )}
                      {isConverted && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border">
                          Converted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {lead.companyName && `${lead.companyName} · `}
                      Lead since {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {!isConverted && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditOpen(true)}
                      disabled={!lead}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
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
          <div className="p-4 lg:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Lead Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Information */}
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{lead.email || "---"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{lead.phone || "---"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Company</p>
                          <p className="font-medium">{lead.companyName || "---"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Job Title</p>
                          <p className="font-medium">{lead.jobTitle || "---"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium">{lead.address || "---"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interest & Details */}
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Interest & Details</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Source</p>
                        <p className="font-medium">{sourceLabels[lead.source] || lead.source}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Interest / Service</p>
                        <p className="font-medium">{lead.interest || "---"}</p>
                      </div>
                    </div>
                    {lead.painPoints && (
                      <div>
                        <p className="text-sm text-gray-500">Pain Points</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{lead.painPoints}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Budget Range</p>
                          <p className="font-medium">
                            {lead.budgetMin || lead.budgetMax
                              ? `$${(lead.budgetMin || 0).toLocaleString()} - $${(lead.budgetMax || 0).toLocaleString()}`
                              : "---"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Industry</p>
                        <p className="font-medium">{lead.industry || "---"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Company Size</p>
                        <p className="font-medium">{lead.companySize || "---"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{lead.location || "---"}</p>
                      </div>
                    </div>
                    {lead.notes && (
                      <div>
                        <p className="text-sm text-gray-500">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Activity Timeline</h2>
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
                      <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No activity recorded yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Log a call, email, meeting, or note to get started.</p>
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
                                activity.activityType === "call" ? "bg-green-500/10 text-green-600" :
                                activity.activityType === "email" ? "bg-blue-500/10 text-blue-600" :
                                activity.activityType === "meeting" ? "bg-purple-500/10 text-purple-600" :
                                activity.activityType === "status_change" ? "bg-orange-500/10 text-orange-600" :
                                "bg-gray-500/10 text-gray-500"
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-px h-full bg-gray-200 dark:bg-gray-800 min-h-[24px]" />
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
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                                      {activity.description}
                                    </p>
                                  )}
                                  {activity.activityType === "call" && (activity.callDuration || activity.callOutcome) && (
                                    <div className="flex gap-3 mt-1">
                                      {activity.callDuration && (
                                        <span className="text-xs text-gray-500">
                                          Duration: {Math.round(activity.callDuration / 60)}m
                                        </span>
                                      )}
                                      {activity.callOutcome && (
                                        <span className="text-xs text-gray-500 capitalize">
                                          Outcome: {activity.callOutcome.replace("_", " ")}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 shrink-0 ml-4">
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
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Lead Status</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Temperature</p>
                      <div className="mt-1">
                        <TemperatureBadge temperature={lead.temperature} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="mt-1">
                        <StatusBadge status={lead.status} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lead Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              lead.leadScore >= 70 ? "bg-green-500" :
                              lead.leadScore >= 40 ? "bg-yellow-500" :
                              "bg-gray-400"
                            }`}
                            style={{ width: `${lead.leadScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.leadScore}</span>
                      </div>
                    </div>
                    {lead.assignedTo && (
                      <div>
                        <p className="text-sm text-gray-500">Assigned To</p>
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
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Next Action</h2>
                  {lead.nextAction ? (
                    <div className="space-y-2">
                      <p className="font-medium">{lead.nextAction}</p>
                      {lead.nextActionDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(lead.nextActionDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No next action set.</p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Activity Stats</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {activities.filter((a) => a.activityType === "call").length}
                      </p>
                      <p className="text-xs text-gray-500">Calls</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {activities.filter((a) => a.activityType === "email").length}
                      </p>
                      <p className="text-xs text-gray-500">Emails</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {activities.filter((a) => a.activityType === "meeting").length}
                      </p>
                      <p className="text-xs text-gray-500">Meetings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {activities.filter((a) => a.activityType === "note").length}
                      </p>
                      <p className="text-xs text-gray-500">Notes</p>
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
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">Lead:</span>{" "}
                    <span className="font-medium">{lead.firstName} {lead.lastName}</span>
                  </p>
                  {lead.companyName && (
                    <p className="text-sm">
                      <span className="text-gray-500">Company:</span>{" "}
                      <span className="font-medium">{lead.companyName}</span>
                    </p>
                  )}
                  {lead.interest && (
                    <p className="text-sm">
                      <span className="text-gray-500">Interest:</span>{" "}
                      <span className="font-medium">{lead.interest}</span>
                    </p>
                  )}
                  {(lead.budgetMin || lead.budgetMax) && (
                    <p className="text-sm">
                      <span className="text-gray-500">Budget:</span>{" "}
                      <span className="font-medium">
                        ${(lead.budgetMin || 0).toLocaleString()} - ${(lead.budgetMax || 0).toLocaleString()}
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
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
    </DashboardLayout>
  )
}
