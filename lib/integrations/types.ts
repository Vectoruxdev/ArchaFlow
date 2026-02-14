export type Provider = "slack" | "discord"

export interface IntegrationConnection {
  id: string
  business_id: string
  provider: Provider
  access_token: string
  refresh_token: string | null
  bot_token: string | null
  token_expires_at: string | null
  provider_metadata: Record<string, unknown>
  connected_by: string | null
  created_at: string
  updated_at: string
}

export interface IntegrationChannel {
  id: string
  connection_id: string
  channel_id: string
  channel_name: string
  channel_type: string | null
  is_selected: boolean
  last_synced_at: string
  last_message_ts: string | null
}

export interface NormalizedMessage {
  id: string
  channelId: string
  channelName: string
  author: string
  content: string
  timestamp: string
  provider: Provider
}

export interface ExtractedTask {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  dueDate: string | null
  confidence: number
  selected: boolean
  sourceMessage: NormalizedMessage
}

export interface MessageScanSession {
  id: string
  connection_id: string
  business_id: string
  initiated_by: string | null
  status: "pending" | "fetching" | "extracting" | "ready" | "imported" | "failed"
  channel_ids: string[]
  raw_messages: NormalizedMessage[]
  extracted_tasks: ExtractedTask[]
  imported_task_ids: string[]
  error_message: string | null
  created_at: string
  updated_at: string
}
