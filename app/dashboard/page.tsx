"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase/client"

type CompanyStats = {
  newLeads: number
  activeProjects: number
  overdueProjects: number
  overdueInvoices: number
  pendingInvoiceTotal: number
  overdueTasks: number
  teamWorkload: number
}

type PersonalStats = {
  myProjects: number
  myTasks: number
  overdueTasks: number
  activeTimeMinutes: number
  upcomingDueCount: number
}

export default function DashboardPage() {
  const { user, currentWorkspace, workspaces, workspacesLoaded, loading: authLoading, switchWorkspace } = useAuth()
  const businessId = currentWorkspace?.id
  const role = currentWorkspace?.role ?? "viewer"
  const isCompanyView = role === "owner" || role === "admin"

  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null)
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const isAuthReady = !authLoading && workspacesLoaded

  useEffect(() => {
    if (isAuthReady && !currentWorkspace && workspaces.length > 0 && switchWorkspace) {
      switchWorkspace(workspaces[0].id)
    }
  }, [isAuthReady, currentWorkspace, workspaces, switchWorkspace])

  useEffect(() => {
    if (!isAuthReady || !businessId || !user) {
      if (isAuthReady && !businessId) setIsLoading(false)
      return
    }

    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    const loadStats = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const today = new Date().toISOString().split("T")[0]
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoStr = weekAgo.toISOString().split("T")[0]

        if (isCompanyView) {
          const [projectsRes, overdueInvoicesRes, pendingInvoicesRes, membersRes] = await Promise.all([
            supabase
              .from("projects")
              .select("id, status, due_date, payment_status")
              .eq("business_id", businessId)
              .is("archived_at", null),
            supabase
              .from("project_invoices")
              .select("id, amount, due_date, status")
              .eq("business_id", businessId)
              .lt("due_date", today)
              .neq("status", "paid"),
            supabase
              .from("project_invoices")
              .select("amount")
              .eq("business_id", businessId)
              .in("status", ["draft", "sent", "overdue"]),
            supabase
              .from("user_roles")
              .select("id")
              .eq("business_id", businessId),
          ])

          const projects = (projectsRes.data || []) as { id: string; status: string; due_date: string | null; payment_status: string }[]
          const projectIds = projects.map((p) => p.id)
          const activeProjects = projects.filter((p) => p.status !== "completed").length
          const overdueProjects = projects.filter((p) => p.due_date && p.due_date < today).length
          const overdueInvoices = (overdueInvoicesRes.data || []).length
          const pendingTotal = (pendingInvoicesRes.data || []).reduce((sum, inv) => sum + Number((inv as { amount: number }).amount || 0), 0)
          const memberCount = Math.max(1, (membersRes.data || []).length)
          const teamWorkload = Math.min(100, Math.round((activeProjects / (memberCount * 2)) * 100))

          let newLeads = 0
          let overdueTasks = 0
          try {
            const [{ count: leadsCount }, tasksRes] = await Promise.all([
              supabase
                .from("leads")
                .select("*", { count: "exact", head: true })
                .eq("business_id", businessId)
                .is("archived_at", null)
                .gte("created_at", weekAgoStr),
              projectIds.length > 0
                ? supabase
                    .from("project_tasks")
                    .select("id")
                    .in("project_id", projectIds)
                    .eq("completed", false)
                    .lt("due_date", today)
                : Promise.resolve({ data: [] }),
            ])
            newLeads = leadsCount ?? 0
            overdueTasks = (tasksRes.data || []).length
          } catch {
            /* leads table may not exist */
          }

          setCompanyStats({
            newLeads,
            activeProjects,
            overdueProjects,
            overdueInvoices,
            pendingInvoiceTotal: pendingTotal,
            overdueTasks,
            teamWorkload,
          })
        } else {
          const projectIdsRes = await supabase
            .from("projects")
            .select("id")
            .eq("business_id", businessId)
            .is("archived_at", null)
          const projectIds = (projectIdsRes.data || []).map((p: { id: string }) => p.id)

          const [
            projectsRes,
            tasksRes,
            timeRes,
            upcomingTasksRes,
          ] = await Promise.all([
            projectIds.length > 0
              ? supabase
                  .from("project_assignments")
                  .select("project_id")
                  .eq("user_id", user.id)
                  .in("project_id", projectIds)
              : Promise.resolve({ data: [] }),
            projectIds.length > 0
              ? supabase
                  .from("project_tasks")
                  .select("id, due_date, completed")
                  .eq("assigned_to", user.id)
                  .in("project_id", projectIds)
              : Promise.resolve({ data: [] }),
            supabase
              .from("project_time_entries")
              .select("duration, is_active")
              .eq("user_id", user.id)
              .or(`is_active.eq.true,date.eq.${today}`),
            projectIds.length > 0
              ? supabase
                  .from("project_tasks")
                  .select("id")
                  .eq("assigned_to", user.id)
                  .eq("completed", false)
                  .gte("due_date", today)
                  .lte("due_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
                  .in("project_id", projectIds)
              : Promise.resolve({ data: [] }),
          ])

          const myProjectIds = new Set((projectsRes.data || []).map((a: { project_id: string }) => a.project_id))
          const tasks = (tasksRes.data || []) as { id: string; due_date: string | null; completed: boolean }[]
          const myTasks = tasks.length
          const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < today && !t.completed).length
          const activeEntries = (timeRes.data || []) as { duration: number; is_active: boolean }[]
          const activeTimeMinutes = activeEntries.reduce((sum, e) => sum + (e.is_active ? (e.duration || 0) : 0), 0)
          const upcomingDueCount = (upcomingTasksRes.data || []).length

          setPersonalStats({
            myProjects: myProjectIds.size,
            myTasks,
            overdueTasks,
            activeTimeMinutes,
            upcomingDueCount,
          })
        }
      } catch (err) {
        console.error("Dashboard load error:", err)
        setLoadError(err instanceof Error ? err.message : "Failed to load dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [isAuthReady, businessId, user?.id, isCompanyView])

  if (!isSupabaseConfigured()) {
    return (
      <AppLayout>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Dashboard requires Supabase configuration.</p>
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return null
  }

  if (!isAuthReady || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!businessId) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center max-w-md mx-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{loadError}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <span className="text-xs text-gray-500 capitalize">{role} view</span>
        </div>

        {isCompanyView && companyStats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0">
              <Link href="/leads">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">New Leads</span>
                    <Target className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{companyStats.newLeads}</div>
                  <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-1">Last 7 days</p>
                </div>
              </Link>
              <Link href="/workflow">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Active Projects</span>
                    <FolderKanban className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{companyStats.activeProjects}</div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">In progress</p>
                </div>
              </Link>
              <Link href="/workflow">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Overdue Projects</span>
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{companyStats.overdueProjects}</div>
                  <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 mt-1">Needs attention</p>
                </div>
              </Link>
              <Link href="/invoices">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Overdue Invoices</span>
                    <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{companyStats.overdueInvoices}</div>
                  <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 mt-1">Past due</p>
                </div>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-0">
              <Link href="/invoices">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Pending Invoices</span>
                    <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                    ${companyStats.pendingInvoiceTotal.toLocaleString()}
                  </div>
                  <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 mt-1">Outstanding</p>
                </div>
              </Link>
              <Link href="/workflow">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Overdue Tasks</span>
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{companyStats.overdueTasks}</div>
                  <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 mt-1">Needs attention</p>
                </div>
              </Link>
              <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Team Workload</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{companyStats.teamWorkload}%</div>
                <div className="mt-1 sm:mt-2 h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black dark:bg-white rounded-full"
                    style={{ width: `${companyStats.teamWorkload}%` }}
                  />
                </div>
              </div>
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
              <Link href="/workflow">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">My Projects</span>
                    <FolderKanban className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{personalStats.myProjects}</div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Assigned to you</p>
                </div>
              </Link>
              <Link href="/workflow">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">My Tasks</span>
                    <ListTodo className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{personalStats.myTasks}</div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">In progress</p>
                </div>
              </Link>
              <Link href="/workflow">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Overdue Tasks</span>
                    <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{personalStats.overdueTasks}</div>
                  <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 mt-1">Needs attention</p>
                </div>
              </Link>
              <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Active Time</span>
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                  {personalStats.activeTimeMinutes > 0 ? `${personalStats.activeTimeMinutes}m` : "—"}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Today</p>
              </div>
              <Link href="/workflow">
                <div className="p-3 sm:p-4 lg:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black min-w-0 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer col-span-2">
                  <div className="flex items-center justify-between gap-2 min-w-0 mb-1">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate min-w-0">Upcoming Due</span>
                    <ListTodo className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-semibold">{personalStats.upcomingDueCount}</div>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Next 7 days</p>
                </div>
              </Link>
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
      </div>
    </AppLayout>
  )
}
