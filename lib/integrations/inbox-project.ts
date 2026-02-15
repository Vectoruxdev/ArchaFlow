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

  // Create the Inbox project
  const { data: created, error } = await adminClient
    .from("projects")
    .insert({
      business_id: businessId,
      title: "Inbox",
      description: "Tasks imported from integrations (Slack, Discord)",
    })
    .select("id, title")
    .single()

  if (error) throw new Error(`Failed to create Inbox project: ${error.message}`)

  return created
}
