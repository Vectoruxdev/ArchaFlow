import useSWR from "swr"
import { supabase } from "@/lib/supabase/client"

export interface Lead {
  id: string
  uniqueCustomerIdentifier: string
  leadTypeId: string | null
  leadTypeName: string | null
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
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
  assignedName: string | null
  clientId: string | null
  projectId: string | null
  convertedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

async function fetchLeads(businessId: string): Promise<Lead[]> {
  const [{ data: leadsData, error: leadsError }, { data: typesData }] = await Promise.all([
    supabase.from("leads").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
    supabase.from("lead_types").select("id, label").eq("business_id", businessId).order("order_index", { ascending: true }),
  ])

  if (leadsError) throw leadsError

  const leadTypeMap = Object.fromEntries((typesData || []).map((lt: any) => [lt.id, lt.label]))

  return (leadsData || []).map((l: any) => ({
    id: l.id,
    uniqueCustomerIdentifier: l.unique_customer_identifier || "",
    leadTypeId: l.lead_type_id || null,
    leadTypeName: l.lead_type_id ? leadTypeMap[l.lead_type_id] || null : null,
    firstName: l.first_name,
    lastName: l.last_name,
    email: l.email || "",
    phone: l.phone || "",
    companyName: l.company_name || "",
    address: l.address || "",
    city: l.city || "",
    state: l.state || "",
    source: l.source || "other",
    interest: l.interest || "",
    painPoints: l.pain_points || "",
    budget: l.budget ?? null,
    squareFootage: l.square_footage ?? null,
    costPerSqft: l.cost_per_sqft ?? null,
    discountType: l.discount_type ?? null,
    discountValue: l.discount_value ?? null,
    temperature: l.temperature || "cold",
    status: l.status || "new",
    leadScore: l.lead_score || 0,
    nextAction: l.next_action || "",
    nextActionDate: l.next_action_date,
    notes: l.notes || "",
    assignedTo: l.assigned_to,
    assignedName: null,
    clientId: l.client_id,
    projectId: l.project_id,
    convertedAt: l.converted_at,
    archivedAt: l.archived_at,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  }))
}

export function useLeads(businessId: string | undefined) {
  return useSWR(
    businessId ? ["leads", businessId] : null,
    ([, id]) => fetchLeads(id),
  )
}
