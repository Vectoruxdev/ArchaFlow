"use client"

import { useEffect } from "react"
import Link from "next/link"
import {
  Target,
  FolderKanban,
  AlertCircle,
  DollarSign,
  CheckCircle2,
  Clock,
  ListTodo,
  ChevronRight,
  StickyNote,
  Paperclip,
  ArrowRightLeft,
  UserPlus,
  FolderPlus,
  User,
} from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { StatsCard } from "@/components/admin/stats-card"
import { useDashboardStats, useDashboardActivities, type CompanyStats, type PersonalStats, type WorkspaceActivity } from "@/lib/hooks/use-dashboard"
import { DashboardSkeleton } from "@/components/ui/skeletons"
import { PageTransition } from "@/components/ui/page-transition"

function formatTimeAgo(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function DashboardPage() {
  const { user, currentWorkspace, workspaces, workspacesLoaded, loading: authLoading, switchWorkspace } = useAuth()
  const businessId = currentWorkspace?.id
  const role = currentWorkspace?.role ?? "viewer"
  const isCompanyView = role === "owner" || role === "admin"

  const { companyStats, personalStats, isLoading, error: loadError } = useDashboardStats(businessId, user?.id, isCompanyView)
  const { data: activities = [] } = useDashboardActivities(businessId)

  const isAuthReady = !authLoading && workspacesLoaded

  useEffect(() => {
    if (isAuthReady && !currentWorkspace && workspaces.length > 0 && switchWorkspace) {
      switchWorkspace(workspaces[0].id)
    }
  }, [isAuthReady, currentWorkspace, workspaces, switchWorkspace])

  if (!isSupabaseConfigured()) {
    return (
      <AppLayout>
        <div className="p-6">
          <p className="text-sm text-[--af-text-secondary]">Dashboard requires Supabase configuration.</p>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return null
  }

  if (!isAuthReady || (isLoading && !companyStats && !personalStats)) {
    return <AppLayout><DashboardSkeleton /></AppLayout>
  }

  if (!businessId) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center max-w-md mx-auto">
            <p className="text-sm text-[--af-text-secondary] mb-4">
              No workspace selected. Select a workspace from the sidebar to view your dashboard.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loadError) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="rounded-card border border-[--af-danger-border] bg-[--af-danger-bg] p-4">
            <p className="text-sm text-[--af-danger-text]">{loadError.message}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageTransition>
      <div style={{ padding: "var(--af-density-page-padding)", display: "flex", flexDirection: "column", gap: "var(--af-density-section-gap)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-[--af-text-muted] mt-1">Overview of your workspace</p>
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted] bg-[--af-bg-surface-alt] px-2 py-1 rounded-badge">{role}</span>
        </div>

        {isCompanyView && companyStats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0">
              <StatsCard href="/leads" title="New Leads" value={companyStats.newLeads} icon={Target} description="Last 7 days" descriptionColor="success" />
              <StatsCard href="/workflow" title="Active Projects" value={companyStats.activeProjects} icon={FolderKanban} description="In progress" />
              <StatsCard href="/workflow" title="Overdue Projects" value={companyStats.overdueProjects} icon={AlertCircle} description="Needs attention" descriptionColor="danger" />
              <StatsCard href="/invoices" title="Overdue Invoices" value={companyStats.overdueInvoices} icon={DollarSign} description="Past due" descriptionColor="danger" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0">
              <StatsCard href="/invoices" title="Pending Invoices" value={`$${companyStats.pendingInvoiceTotal.toLocaleString()}`} icon={DollarSign} description="Outstanding" descriptionColor="warning" />
              <StatsCard href="/workflow" title="Overdue Tasks" value={companyStats.overdueTasks} icon={AlertCircle} description="Needs attention" descriptionColor="danger" />
              <StatsCard title="Team Workload" value={`${companyStats.teamWorkload}%`} icon={CheckCircle2} progress={companyStats.teamWorkload} className="col-span-2 lg:col-span-1" />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href="/workflow" className="flex items-center gap-1">
                  View workflow <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </>
        )}

        {!isCompanyView && personalStats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0">
              <StatsCard href="/workflow" title="My Projects" value={personalStats.myProjects} icon={FolderKanban} description="Assigned to you" />
              <StatsCard href="/workflow" title="My Tasks" value={personalStats.myTasks} icon={ListTodo} description="In progress" />
              <StatsCard href="/workflow" title="Overdue Tasks" value={personalStats.overdueTasks} icon={AlertCircle} description="Needs attention" descriptionColor="danger" />
              <StatsCard title="Active Time" value={personalStats.activeTimeMinutes > 0 ? `${personalStats.activeTimeMinutes}m` : "\u2014"} icon={Clock} description="Today" />
              <StatsCard href="/workflow" title="Upcoming Due" value={personalStats.upcomingDueCount} icon={ListTodo} description="Next 7 days" className="col-span-2" />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href="/workflow" className="flex items-center gap-1">
                  View workflow <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </>
        )}

        {/* Recent Activity */}
        <div className="p-4 rounded-card border border-[--af-border-default] bg-[--af-bg-surface]">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-[--af-text-muted]">No recent activity yet.</p>
            ) : (
              activities.map((activity) => {
                const iconMap: Record<string, React.ReactElement> = {
                  project_moved: <ArrowRightLeft className="w-4 h-4" />,
                  lead_converted: <Target className="w-4 h-4" />,
                  member_invited: <UserPlus className="w-4 h-4" />,
                  member_joined: <User className="w-4 h-4" />,
                  project_created: <FolderPlus className="w-4 h-4" />,
                  client_created: <User className="w-4 h-4" />,
                }
                const Icon = iconMap[activity.activity_type] || <StickyNote className="w-4 h-4" />
                const timeAgo = formatTimeAgo(activity.created_at)
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[--af-bg-surface-alt] flex items-center justify-center flex-shrink-0 text-[--af-text-secondary]">
                      {Icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">
                        {activity.message}
                      </p>
                      <p className="text-xs text-[--af-text-muted] mt-1">{timeAgo}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
      </PageTransition>
    </AppLayout>
  )
}
