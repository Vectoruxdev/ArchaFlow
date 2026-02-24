import useSWR from "swr"
import { supabase } from "@/lib/supabase/client"

export interface ClientContact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  description: string
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  description: string
  archivedAt: string | null
  createdAt: string
  totalProjects: number
  activeProjects: number
  contacts: ClientContact[]
}

async function fetchClients(businessId: string): Promise<Client[]> {
  const [{ data: clientsData, error: clientsError }, { data: projectCounts, error: projectsError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("*, client_contacts(*)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("client_id, archived_at")
        .eq("business_id", businessId)
        .not("client_id", "is", null),
    ])

  if (clientsError) throw clientsError
  if (projectsError) throw projectsError

  const countMap: Record<string, { total: number; active: number }> = {}
  for (const proj of projectCounts || []) {
    if (!proj.client_id) continue
    if (!countMap[proj.client_id]) {
      countMap[proj.client_id] = { total: 0, active: 0 }
    }
    countMap[proj.client_id].total++
    if (!proj.archived_at) {
      countMap[proj.client_id].active++
    }
  }

  return (clientsData || []).map((c: any) => ({
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email || "",
    phone: c.phone || "",
    address: c.address || "",
    description: c.description || "",
    archivedAt: c.archived_at,
    createdAt: c.created_at,
    totalProjects: countMap[c.id]?.total || 0,
    activeProjects: countMap[c.id]?.active || 0,
    contacts: (c.client_contacts || []).map((cc: any) => ({
      id: cc.id,
      firstName: cc.first_name,
      lastName: cc.last_name,
      email: cc.email || "",
      phone: cc.phone || "",
      role: cc.role || "",
      description: cc.description || "",
    })),
  }))
}

export function useClients(businessId: string | undefined) {
  return useSWR(
    businessId ? ["clients", businessId] : null,
    ([, id]) => fetchClients(id),
  )
}
