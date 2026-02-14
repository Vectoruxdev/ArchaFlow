import type { SupabaseClient } from "@supabase/supabase-js"

export async function getOrCreateInboxProject(
  adminClient: SupabaseClient,
  businessId: string
): Promise<{ id: string; title: string }> {
  // Look for existing Inbox project
  const { data: existing } = await adminClient
    .from("projects")
    .select("id, title")
    .eq("business_id", businessId)
    .eq("title", "Inbox")
    .limit(1)
    .single()

  if (existing) return existing

  // Get the first status for this workspace to use as default
  const { data: statuses } = await adminClient
    .from("project_statuses")
    .select("id")
    .eq("business_id", businessId)
    .order("order_index", { ascending: true })
    .limit(1)

  const statusId = statuses?.[0]?.id

  // Create the Inbox project
  const insertData: Record<string, unknown> = {
    business_id: businessId,
    title: "Inbox",
    description: "Tasks imported from integrations (Slack, Discord)",
  }
  if (statusId) insertData.status_id = statusId

  const { data: created, error } = await adminClient
    .from("projects")
    .insert(insertData)
    .select("id, title")
    .single()

  if (error) throw new Error(`Failed to create Inbox project: ${error.message}`)

  return created
}
