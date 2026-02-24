import useSWR from "swr"
import { supabase } from "@/lib/supabase/client"

export interface ClientDetail {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  description: string
  archivedAt: string | null
  createdAt: string
  contacts: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    description: string
  }[]
}

export interface LinkedProject {
  id: string
  title: string
  status: string
  budget: number | null
  dueDate: string | null
  archivedAt: string | null
}

export interface LinkedContract {
  id: string
  name: string
  status: string
  sentAt: string | null
  signedAt: string | null
}

async function fetchClientDetail(clientId: string) {
  const [clientRes, projectsRes, contractsRes] = await Promise.all([
    supabase.from("clients").select("*, client_contacts(*)").eq("id", clientId).single(),
    supabase.from("projects").select("id, title, status, budget, due_date, archived_at").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("contracts").select("id, name, status, sent_at, signed_at").eq("client_id", clientId).order("created_at", { ascending: false }),
  ])

  if (clientRes.error) throw clientRes.error

  const data = clientRes.data
  const client: ClientDetail = {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    description: data.description || "",
    archivedAt: data.archived_at,
    createdAt: data.created_at,
    contacts: (data.client_contacts || []).map((cc: any) => ({
      id: cc.id,
      firstName: cc.first_name,
      lastName: cc.last_name,
      email: cc.email || "",
      phone: cc.phone || "",
      role: cc.role || "",
      description: cc.description || "",
    })),
  }

  const projects: LinkedProject[] = (projectsRes.data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    budget: p.budget,
    dueDate: p.due_date,
    archivedAt: p.archived_at,
  }))

  const contracts: LinkedContract[] = (contractsRes.data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    sentAt: c.sent_at,
    signedAt: c.signed_at,
  }))

  return { client, projects, contracts }
}

export function useClientDetail(clientId: string | undefined) {
  return useSWR(
    clientId ? ["client-detail", clientId] : null,
    ([, id]) => fetchClientDetail(id),
  )
}
