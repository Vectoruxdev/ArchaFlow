/**
 * Workspace Activity Recording
 * Records activities for the Recent Activity feed.
 * Designed for future permission/position-based filtering.
 */

import { supabase } from "./supabase/client"

export type ActivityType =
  | "project_moved"
  | "lead_converted"
  | "member_invited"
  | "member_joined"
  | "project_created"
  | "client_created"
  | "integration_connected"
  | "tasks_imported"
  | "contract_created"
  | "contract_sent"
  | "contract_signed"
  | "contract_voided"

export interface RecordActivityParams {
  businessId: string
  userId?: string
  activityType: ActivityType
  entityType?: string
  entityId?: string
  message: string
  metadata?: Record<string, unknown>
}

export async function recordActivity(params: RecordActivityParams): Promise<void> {
  const { businessId, userId, activityType, entityType, entityId, message, metadata } = params

  const { error } = await supabase.from("workspace_activities").insert({
    business_id: businessId,
    user_id: userId ?? null,
    activity_type: activityType,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    message,
    metadata: metadata ?? {},
  })

  if (error) {
    console.error("[Activity] Failed to record:", error)
  }
}
