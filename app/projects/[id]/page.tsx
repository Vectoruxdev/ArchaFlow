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
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProjectDetailContent } from "@/components/project/project-detail-content"
import { AssignTeamModal } from "@/components/project/assign-team-modal"
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
  lead: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  sale: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  design: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
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
      alert("Failed to archive project: " + error.message)
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
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {isLoading ? (
                  // Loading skeleton
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-2" />
                  </div>
                ) : loadError ? (
                  // Error state
                  <div>
                    <div className="text-red-600">Error loading project</div>
                    <p className="text-sm text-gray-500 mt-1">{loadError}</p>
                  </div>
                ) : projectData ? (
                  // Actual data
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold">{projectData.title}</h1>
                      <Badge className={`${statusColors[projectData.status as keyof typeof statusColors] || statusColors.lead} border`}>
                        {projectData.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{projectData.client.name}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
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
    </DashboardLayout>
  )
}
