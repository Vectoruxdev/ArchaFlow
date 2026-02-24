import useSWR from "swr"
import { supabase } from "@/lib/supabase/client"
import { authFetch } from "@/lib/auth/auth-fetch"

export interface Project {
  id: string
  title: string
  client: string
  clientId: string | null
  status: "lead" | "sale" | "design" | "completed"
  paymentStatus: "pending" | "partial" | "paid"
  budget: number
  spent: number
  startDate: string
  dueDate: string
  progress: number
  assignees: { name: string; avatar: string }[]
  priority: "low" | "medium" | "high"
  archivedAt?: string | null
}

async function fetchProjects(businessId: string): Promise<Project[]> {
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
    .select(`*, project_assignments(user_id)`)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((proj: any) => ({
    id: proj.id,
    title: proj.title,
    client: proj.client_name || "Unknown Client",
    clientId: proj.client_id || null,
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
}

export function useProjects(businessId: string | undefined) {
  return useSWR(
    businessId ? ["projects", businessId] : null,
    ([, id]) => fetchProjects(id),
  )
}
