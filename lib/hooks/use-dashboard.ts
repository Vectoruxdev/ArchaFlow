import useSWR from "swr"
import { supabase } from "@/lib/supabase/client"
import { authFetch } from "@/lib/auth/auth-fetch"

export type CompanyStats = {
  newLeads: number
  activeProjects: number
  overdueProjects: number
  overdueInvoices: number
  pendingInvoiceTotal: number
  overdueTasks: number
  teamWorkload: number
}

export type PersonalStats = {
  myProjects: number
  myTasks: number
  overdueTasks: number
  activeTimeMinutes: number
  upcomingDueCount: number
}

export type WorkspaceActivity = {
  id: string
  activity_type: string
  message: string
  created_at: string
  user_id: string | null
}

async function fetchCompanyStats(businessId: string): Promise<CompanyStats> {
  const today = new Date().toISOString().split("T")[0]
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split("T")[0]

  const [projectsRes, overdueInvoicesRes, pendingInvoicesRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, status, due_date, payment_status")
      .eq("business_id", businessId)
      .is("archived_at", null),
    supabase
      .from("invoices")
      .select("id, total, due_date, status")
      .eq("business_id", businessId)
      .lt("due_date", today)
      .in("status", ["sent", "viewed", "overdue", "partially_paid"]),
    supabase
      .from("invoices")
      .select("amount_due")
      .eq("business_id", businessId)
      .in("status", ["draft", "sent", "viewed", "overdue", "partially_paid"]),
  ])

  const projects = (projectsRes.data || []) as { id: string; status: string; due_date: string | null; payment_status: string }[]
  const projectIds = projects.map((p) => p.id)
  const activeProjects = projects.filter((p) => p.status !== "completed").length
  const overdueProjects = projects.filter((p) => p.due_date && p.due_date < today).length
  const overdueInvoices = (overdueInvoicesRes.data || []).length
  const pendingTotal = (pendingInvoicesRes.data || []).reduce((sum, inv) => sum + Number((inv as { amount_due: number }).amount_due || 0), 0)

  let newLeads = 0
  let overdueTasks = 0
  let teamWorkload = 0
  try {
    const [{ count: leadsCount }, overdueTasksRes, allTasksRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .is("archived_at", null)
        .gte("created_at", weekAgoStr),
      projectIds.length > 0
        ? supabase.from("project_tasks").select("id").in("project_id", projectIds).eq("completed", false).lt("due_date", today)
        : Promise.resolve({ data: [] }),
      projectIds.length > 0
        ? supabase.from("project_tasks").select("id, completed").in("project_id", projectIds)
        : Promise.resolve({ data: [] }),
    ])
    newLeads = leadsCount ?? 0
    overdueTasks = (overdueTasksRes.data || []).length

    const completedProjects = projects.filter((p) => p.status === "completed").length
    const allTasks = (allTasksRes.data || []) as { id: string; completed: boolean }[]
    const completedTasks = allTasks.filter((t) => t.completed).length
    teamWorkload = Math.round(((completedTasks + completedProjects) / Math.max(1, allTasks.length + projects.length)) * 100)
  } catch {
    /* leads table may not exist */
  }

  return { newLeads, activeProjects, overdueProjects, overdueInvoices, pendingInvoiceTotal: pendingTotal, overdueTasks, teamWorkload }
}

async function fetchPersonalStats(businessId: string, userId: string): Promise<PersonalStats> {
  const today = new Date().toISOString().split("T")[0]

  const projectIdsRes = await supabase
    .from("projects")
    .select("id")
    .eq("business_id", businessId)
    .is("archived_at", null)
  const projectIds = (projectIdsRes.data || []).map((p: { id: string }) => p.id)

  const [projectsRes, tasksRes, timeRes, upcomingTasksRes] = await Promise.all([
    projectIds.length > 0
      ? supabase.from("project_assignments").select("project_id").eq("user_id", userId).in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? supabase.from("project_tasks").select("id, due_date, completed").eq("assigned_to", userId).in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
    supabase.from("project_time_entries").select("duration, is_active").eq("user_id", userId).or(`is_active.eq.true,date.eq.${today}`),
    projectIds.length > 0
      ? supabase.from("project_tasks").select("id").eq("assigned_to", userId).eq("completed", false).gte("due_date", today).lte("due_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]).in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
  ])

  const myProjectIds = new Set((projectsRes.data || []).map((a: { project_id: string }) => a.project_id))
  const tasks = (tasksRes.data || []) as { id: string; due_date: string | null; completed: boolean }[]
  const overdueTasks = tasks.filter((t) => t.due_date && t.due_date < today && !t.completed).length
  const activeEntries = (timeRes.data || []) as { duration: number; is_active: boolean }[]
  const activeTimeMinutes = activeEntries.reduce((sum, e) => sum + (e.is_active ? (e.duration || 0) : 0), 0)

  return {
    myProjects: myProjectIds.size,
    myTasks: tasks.length,
    overdueTasks,
    activeTimeMinutes,
    upcomingDueCount: (upcomingTasksRes.data || []).length,
  }
}

async function fetchActivities(businessId: string): Promise<WorkspaceActivity[]> {
  try {
    const res = await authFetch(`/api/activities?businessId=${encodeURIComponent(businessId)}`)
    if (res.ok) {
      const data = await res.json()
      return Array.isArray(data) ? data : []
    }
  } catch {
    // ignore
  }
  return []
}

export function useDashboardStats(businessId: string | undefined, userId: string | undefined, isCompanyView: boolean) {
  const companyResult = useSWR(
    businessId && isCompanyView ? ["dashboard-company", businessId] : null,
    ([, id]) => fetchCompanyStats(id),
  )

  const personalResult = useSWR(
    businessId && userId && !isCompanyView ? ["dashboard-personal", businessId, userId] : null,
    ([, bizId, uid]) => fetchPersonalStats(bizId, uid),
  )

  return {
    companyStats: companyResult.data ?? null,
    personalStats: personalResult.data ?? null,
    isLoading: isCompanyView ? companyResult.isLoading : personalResult.isLoading,
    error: isCompanyView ? companyResult.error : personalResult.error,
  }
}

export function useDashboardActivities(businessId: string | undefined) {
  return useSWR(
    businessId ? ["dashboard-activities", businessId] : null,
    ([, id]) => fetchActivities(id),
  )
}
