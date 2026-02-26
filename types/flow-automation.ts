// ============================================================
// Flow Automation — Type Definitions
// ============================================================

// --- Trigger Types (Phase 1) ---
export type TriggerType =
  | 'card_moved_to'
  | 'card_moved_from'
  | 'card_moved_between'
  | 'card_created'
  | 'card_archived'
  | 'card_deleted'
  | 'card_assignee_set'
  | 'card_assignee_removed'
  | 'card_priority_changed'
  | 'card_tag_added'
  | 'card_tag_removed'
  | 'card_due_date_set'
  | 'due_date_approaching'
  | 'due_date_passed'
  | 'card_field_changed'
  | 'card_stuck_in_column'

// --- Action Types ---
export type ActionType =
  // Card actions
  | 'move_card'
  | 'assign_user'
  | 'assign_random_from_group'
  | 'unassign_user'
  | 'set_priority'
  | 'add_tag'
  | 'remove_tag'
  | 'remove_all_tags'
  | 'set_due_date'
  | 'clear_due_date'
  | 'set_custom_field'
  | 'clear_custom_field'
  | 'add_automated_comment'
  | 'copy_card'
  | 'archive_card'
  // Subtask actions
  | 'create_subtask'
  | 'create_subtask_set'
  | 'complete_all_subtasks'
  | 'assign_all_subtasks'
  // Notification actions
  | 'notify_user'
  | 'notify_card_assignee'
  | 'notify_card_creator'
  | 'notify_team'
  | 'send_email'
  // Contract actions (Phase 2)
  | 'generate_contract'
  | 'send_contract'
  | 'set_contract_status'
  // Invoice actions (Phase 2)
  | 'create_invoice'
  | 'send_invoice'
  | 'set_invoice_status'
  // AI actions (Phase 2)
  | 'ai_summarize_card'
  | 'ai_auto_tag'
  | 'ai_draft_email'
  | 'ai_classify_card'

// --- Condition Operators ---
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_one_of'
  | 'greater_than'
  | 'less_than'
  | 'is_set'
  | 'is_not_set'

// --- Action Categories ---
export type ActionCategory =
  | 'card'
  | 'subtask'
  | 'notification'
  | 'team'
  | 'contracts'
  | 'invoices'
  | 'ai'
  | 'integration'
  | 'reporting'

// --- Run Status ---
export type RunStatus = 'success' | 'partial' | 'failed'

// ============================================================
// Core Interfaces
// ============================================================

export interface FlowTrigger {
  type: TriggerType
  config: Record<string, unknown>
}

export interface FlowCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: unknown
}

export interface FlowAction {
  id: string
  type: ActionType
  config: Record<string, unknown>
  order: number
  continueOnFailure: boolean
}

export interface FlowRule {
  id: string
  boardId: string
  workspaceId: string
  name: string
  description?: string
  isActive: boolean
  trigger: FlowTrigger
  conditions: FlowCondition[]
  actions: FlowAction[]
  runCount: number
  lastRunAt?: string
  lastRunStatus?: RunStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface FlowRunLog {
  id: string
  ruleId: string
  boardId: string
  cardId?: string
  triggeredBy?: string
  triggeredAt: string
  status: RunStatus
  actionsTotal: number
  actionsSucceeded: number
  actionsFailed: number
  actionResults: ActionResult[]
  errorMessage?: string
  durationMs: number
}

export interface FlowRecipeTemplate {
  id: string
  name: string
  description?: string
  category: string
  triggerType: TriggerType
  triggerConfig: Record<string, unknown>
  conditions: FlowCondition[]
  actions: FlowAction[]
  previewSummary?: string
  isFeatured: boolean
  sortOrder: number
  createdAt: string
}

// ============================================================
// Engine Interfaces
// ============================================================

export interface KanbanEvent {
  type: string
  boardId: string
  cardId: string
  triggeredBy: string
  payload: Record<string, unknown>
}

export interface FlowContext {
  rule: FlowRule
  card: CardData
  board: BoardData
  event: KanbanEvent
  previousActionOutputs: Record<string, unknown>
  runId: string
}

export interface ActionResult {
  success: boolean
  output?: Record<string, unknown>
  error?: string
  details?: string
}

export interface FlowRunResult {
  ruleId: string
  runId: string
  status: RunStatus
  actionResults: ActionResult[]
  durationMs: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ============================================================
// Board / Card Data (used in FlowContext)
// ============================================================

export interface CardData {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  startDate?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  assignees: Array<{ id: string; name: string; email: string }>
  primaryOwnerId?: string
  createdBy?: string
  creatorName?: string
  creatorEmail?: string
  tags: string[]
  customFields: Record<string, unknown>
  businessId: string
  createdAt?: string
  updatedAt?: string
}

export interface BoardData {
  id: string
  name: string
  columns: Array<{ id: string; label: string; colorKey: string }>
  workspaceId: string
}

// ============================================================
// Config Schema (drives dynamic UI forms)
// ============================================================

export type ConfigFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'user_picker'
  | 'team_picker'
  | 'column_picker'
  | 'tag_picker'
  | 'field_picker'
  | 'date'
  | 'boolean'
  | 'priority_picker'

export interface ConfigField {
  key: string
  label: string
  type: ConfigFieldType
  required: boolean
  placeholder?: string
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  supportsVariables?: boolean
  helpText?: string
}

export interface ActionConfigSchema {
  fields: ConfigField[]
  comingSoon?: boolean
}

// ============================================================
// Handler Interfaces (for Registry)
// ============================================================

export interface ActionHandler {
  type: ActionType
  label: string
  description: string
  category: ActionCategory
  icon: string
  configSchema: ActionConfigSchema
  execute: (config: Record<string, unknown>, context: FlowContext) => Promise<ActionResult>
  validate: (config: Record<string, unknown>) => ValidationResult
  summarize: (config: Record<string, unknown>, boardContext?: BoardData) => string
}

export interface TriggerHandler {
  type: TriggerType
  label: string
  description: string
  icon: string
  configSchema: ActionConfigSchema
  matches: (event: KanbanEvent, triggerConfig: Record<string, unknown>) => boolean
  validate: (config: Record<string, unknown>) => ValidationResult
  summarize: (config: Record<string, unknown>, boardContext?: BoardData) => string
}

// ============================================================
// Variable System
// ============================================================

export interface VariableHint {
  key: string
  label: string
  example?: string
  category: 'card' | 'board' | 'trigger' | 'step'
}

// ============================================================
// DB Row Types (snake_case, matching Supabase)
// ============================================================

export interface FlowRuleRow {
  id: string
  board_id: string
  workspace_id: string
  name: string
  description: string | null
  is_active: boolean
  trigger_type: string
  trigger_config: Record<string, unknown>
  conditions: FlowCondition[]
  actions: FlowAction[]
  run_count: number
  last_run_at: string | null
  last_run_status: RunStatus | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FlowRunLogRow {
  id: string
  rule_id: string
  board_id: string
  card_id: string | null
  triggered_by: string | null
  triggered_at: string
  status: RunStatus
  actions_total: number
  actions_succeeded: number
  actions_failed: number
  action_results: ActionResult[]
  error_message: string | null
  duration_ms: number
}

export interface FlowRecipeTemplateRow {
  id: string
  name: string
  description: string | null
  category: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  conditions: FlowCondition[]
  actions: FlowAction[]
  preview_summary: string | null
  is_featured: boolean
  sort_order: number
  created_at: string
}

// ============================================================
// Conversion helpers
// ============================================================

export function flowRuleFromRow(row: FlowRuleRow): FlowRule {
  return {
    id: row.id,
    boardId: row.board_id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description ?? undefined,
    isActive: row.is_active,
    trigger: {
      type: row.trigger_type as TriggerType,
      config: row.trigger_config,
    },
    conditions: row.conditions ?? [],
    actions: row.actions ?? [],
    runCount: row.run_count,
    lastRunAt: row.last_run_at ?? undefined,
    lastRunStatus: row.last_run_status ?? undefined,
    createdBy: row.created_by ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function flowRecipeFromRow(row: FlowRecipeTemplateRow): FlowRecipeTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category,
    triggerType: row.trigger_type as TriggerType,
    triggerConfig: row.trigger_config,
    conditions: row.conditions ?? [],
    actions: row.actions ?? [],
    previewSummary: row.preview_summary ?? undefined,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}
