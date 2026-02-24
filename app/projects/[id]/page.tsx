"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MoreVertical,
  Archive,
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
import { AppLayout } from "@/components/layout/app-layout"
const ProjectDetailContent = dynamic(() => import("@/components/project/project-detail-content").then(m => ({ default: m.ProjectDetailContent })), { ssr: false })
import dynamic from "next/dynamic"

const AssignTeamModal = dynamic(() => import("@/components/project/assign-team-modal").then(m => ({ default: m.AssignTeamModal })), { ssr: false })
import { toast } from "@/lib/toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

// Types
interface ProjectHeader {
  id: string
  title: string
  client: {
    name: string
  }
  status: "lead" | "sale" | "design" | "completed" | string
  businessId?: string
  primaryOwnerId?: string | null
  secondaryOwnerId?: string | null
}

const statusColors = {
  lead: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
  sale: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  design: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  completed: "bg-[--af-success-bg]0/10 text-[--af-success-text] border-[--af-success-border]/20",
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [projectData, setProjectData] = useState<ProjectHeader | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  // Load project header when component mounts or ID changes
  useEffect(() => {
    loadProjectHeader()
  }, [params.id])

  const loadProjectHeader = async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      console.log("🔄 Loading project header for ID:", params.id)

      const columnsWithOwners = "id, title, client_name, status, business_id, primary_owner_id, secondary_owner_id"
      const { data: dataWithOwners, error: errWithOwners } = await supabase
        .from("projects")
        .select(columnsWithOwners)
        .eq("id", params.id)
        .single()

      let data: { id: string; title: string; client_name: string | null; status: string; business_id: string; primary_owner_id?: string | null; secondary_owner_id?: string | null } | null
      let error = errWithOwners
      let usedFallback = false

      if (error && typeof error.message === "string" && error.message.includes("primary_owner_id")) {
        const columnsWithoutOwners = "id, title, client_name, status, business_id"
        const fallback = await supabase
          .from("projects")
          .select(columnsWithoutOwners)
          .eq("id", params.id)
          .single()
        data = fallback.data
        error = fallback.error
        usedFallback = true
      } else {
        data = dataWithOwners
      }

      if (error) throw error

      if (data) {
        const primaryOwnerId = usedFallback ? null : (data as { primary_owner_id?: string | null }).primary_owner_id ?? null
        const secondaryOwnerId = usedFallback ? null : (data as { secondary_owner_id?: string | null }).secondary_owner_id ?? null
        console.log("✅ Project header loaded:", data)
        setProjectData({
          id: data.id,
          title: data.title,
          client: {
            name: data.client_name || "Unknown Client",
          },
          status: data.status,
          businessId: data.business_id,
          primaryOwnerId,
          secondaryOwnerId,
        })
      }
    } catch (err: any) {
      console.error("❌ Error loading project header:", err)
      setLoadError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const archiveProject = async () => {
    if (!currentWorkspace?.id) return

    try {
      const { error } = await supabase
        .from("projects")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", params.id)
        .eq("business_id", currentWorkspace.id)

      if (error) throw error

      window.dispatchEvent(new Event('projectsUpdated'))
      router.push("/projects")
    } catch (error: any) {
      console.error("Error archiving project:", error)
      toast.error("Failed to archive project: " + error.message)
    }
  }

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/projects")
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-950">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[--af-bg-surface] border-b border-[--af-border-default]">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {isLoading ? (
                  // Loading skeleton
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-48 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse" />
                      <div className="h-6 w-20 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-32 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse mt-2" />
                  </div>
                ) : loadError ? (
                  // Error state
                  <div>
                    <div className="text-[--af-danger-text]">Error loading project</div>
                    <p className="text-sm text-[--af-text-muted] mt-1">{loadError}</p>
                  </div>
                ) : projectData ? (
                  // Actual data
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight truncate">{projectData.title}</h1>
                      <Badge className={`${statusColors[projectData.status as keyof typeof statusColors] || statusColors.lead} border shrink-0`}>
                        {projectData.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[--af-text-muted] mt-1">{projectData.client.name}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                <Button variant="outline">Change Status</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAssignModalOpen(true)}>
                      Assign Team Members
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Project Details</DropdownMenuItem>
                    <DropdownMenuItem>Generate Report</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-orange-600"
                      onClick={() => archiveProject()}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <ProjectDetailContent projectId={params.id} />

        {projectData?.businessId && (
          <AssignTeamModal
            open={assignModalOpen}
            projectId={params.id}
            businessId={projectData.businessId}
            currentPrimaryOwnerId={projectData.primaryOwnerId ?? null}
            currentSecondaryOwnerId={projectData.secondaryOwnerId ?? null}
            onClose={() => setAssignModalOpen(false)}
            onSave={() => {
              setAssignModalOpen(false)
              window.dispatchEvent(new Event("projectAssignmentsUpdated"))
              loadProjectHeader()
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
