import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { triggerRegistry } from './trigger-registry'
import { actionRegistry } from './action-registry'
import { resolveVariables } from './variable-resolver'
import type {
  KanbanEvent,
  FlowRule,
  FlowContext,
  FlowRunResult,
  ActionResult,
  CardData,
  BoardData,
  FlowCondition,
  ConditionOperator,
  FlowRuleRow,
  ActionType,
  RunStatus,
} from '@/types/flow-automation'
import { flowRuleFromRow } from '@/types/flow-automation'

// Ensure all triggers and actions are registered
import './triggers/index'
import './actions/index'

/**
 * Main entry point: evaluate all active rules for a given board event.
 * Call this after card mutations (move, create, archive, etc.).
 */
export async function evaluateRulesForEvent(event: KanbanEvent): Promise<void> {
  try {
    const admin = getSupabaseAdmin()

    // Fetch all active rules for this board
    const { data: rows, error } = await admin
      .from('flow_rules')
      .select('*')
      .eq('board_id', event.boardId)
      .eq('is_active', true)

    if (error) {
      console.error('[FlowEngine] Error fetching rules:', error)
      return
    }

    if (!rows || rows.length === 0) return

    const rules = (rows as FlowRuleRow[]).map(flowRuleFromRow)

    // Evaluate each rule in parallel
    const evaluations = rules.map(async (rule) => {
      try {
        const trigger = triggerRegistry.get(rule.trigger.type)
        if (!trigger) return

        if (!trigger.matches(event, rule.trigger.config)) return

        // Fetch card data
        const card = await fetchCardData(event.cardId, event.boardId)
        if (!card) return

        // Check conditions
        if (!checkConditions(rule.conditions, card)) return

        // Fetch board data
        const board = await fetchBoardData(event.boardId)
        if (!board) return

        // Execute the rule
        await executeRule(rule, event, card, board)
      } catch (err) {
        console.error(`[FlowEngine] Error evaluating rule "${rule.name}":`, err)
      }
    })

    await Promise.all(evaluations)
  } catch (err) {
    console.error('[FlowEngine] Unexpected error:', err)
  }
}

/**
 * Check all conditions against card data (AND logic).
 * Returns true if all conditions pass, or if no conditions exist.
 */
export function checkConditions(conditions: FlowCondition[], card: CardData): boolean {
  if (!conditions || conditions.length === 0) return true

  return conditions.every((condition) => {
    try {
      const fieldValue = getFieldValue(condition.field, card)
      return evaluateCondition(fieldValue, condition.operator, condition.value)
    } catch {
      return false
    }
  })
}

function getFieldValue(field: string, card: CardData): unknown {
  switch (field) {
    case 'title': return card.title
    case 'description': return card.description
    case 'priority': return card.priority
    case 'status':
    case 'column': return card.status
    case 'assignee': return card.assignees?.[0]?.id ?? null
    case 'assignee_name': return card.assignees?.[0]?.name ?? null
    case 'due_date': return card.dueDate
    case 'tags': return card.tags
    case 'creator': return card.createdBy
    default: {
      // Custom field
      if (field.startsWith('custom.')) {
        return card.customFields?.[field.slice(7)]
      }
      return card.customFields?.[field]
    }
  }
}

function evaluateCondition(fieldValue: unknown, operator: ConditionOperator, conditionValue: unknown): boolean {
  switch (operator) {
    case 'equals':
      return String(fieldValue) === String(conditionValue)

    case 'not_equals':
      return String(fieldValue) !== String(conditionValue)

    case 'contains': {
      const str = String(fieldValue ?? '')
      const search = String(conditionValue ?? '')
      return str.toLowerCase().includes(search.toLowerCase())
    }

    case 'not_contains': {
      const str = String(fieldValue ?? '')
      const search = String(conditionValue ?? '')
      return !str.toLowerCase().includes(search.toLowerCase())
    }

    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '' ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)

    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '' &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)

    case 'is_one_of': {
      const allowed = Array.isArray(conditionValue) ? conditionValue : [conditionValue]
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(v => allowed.includes(v))
      }
      return allowed.includes(fieldValue)
    }

    case 'greater_than':
      return Number(fieldValue) > Number(conditionValue)

    case 'less_than':
      return Number(fieldValue) < Number(conditionValue)

    case 'is_set':
      return fieldValue !== null && fieldValue !== undefined

    case 'is_not_set':
      return fieldValue === null || fieldValue === undefined

    default:
      return false
  }
}

/**
 * Execute a matched rule: run all actions in order, log the result.
 */
async function executeRule(
  rule: FlowRule,
  event: KanbanEvent,
  card: CardData,
  board: BoardData,
): Promise<FlowRunResult> {
  const startTime = Date.now()
  const runId = crypto.randomUUID()

  const context: FlowContext = {
    rule,
    card,
    board,
    event,
    previousActionOutputs: {},
    runId,
  }

  const actionResults: ActionResult[] = []
  let stopped = false

  for (let i = 0; i < rule.actions.length; i++) {
    if (stopped) break

    const action = rule.actions[i]
    const handler = actionRegistry.get(action.type as ActionType)

    if (!handler) {
      const result: ActionResult = {
        success: false,
        error: `Unknown action type: ${action.type}`,
      }
      actionResults.push(result)
      if (!action.continueOnFailure) {
        stopped = true
      }
      continue
    }

    try {
      // Resolve variables in string config values
      const resolvedConfig = resolveConfigVariables(action.config, context)
      const result = await handler.execute(resolvedConfig, context)
      actionResults.push(result)

      // Store output for subsequent actions
      if (result.output) {
        context.previousActionOutputs[`step.${i}`] = result.output
      }

      if (!result.success && !action.continueOnFailure) {
        stopped = true
      }
    } catch (err) {
      const result: ActionResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
      actionResults.push(result)
      if (!action.continueOnFailure) {
        stopped = true
      }
    }
  }

  const durationMs = Date.now() - startTime
  const succeeded = actionResults.filter(r => r.success).length
  const failed = actionResults.filter(r => !r.success).length

  let status: RunStatus = 'success'
  if (failed > 0 && succeeded > 0) status = 'partial'
  else if (failed > 0 && succeeded === 0) status = 'failed'

  const runResult: FlowRunResult = {
    ruleId: rule.id,
    runId,
    status,
    actionResults,
    durationMs,
  }

  // Log the run (non-blocking)
  logRun(runResult, context).catch(err => {
    console.error('[FlowEngine] Failed to log run:', err)
  })

  return runResult
}

/**
 * Resolve {{variables}} in all string values within a config object.
 */
function resolveConfigVariables(
  config: Record<string, unknown>,
  context: FlowContext,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      resolved[key] = resolveVariables(value, context)
    } else {
      resolved[key] = value
    }
  }
  return resolved
}

/**
 * Log a rule run to flow_run_log and update the rule's counters.
 */
async function logRun(result: FlowRunResult, context: FlowContext): Promise<void> {
  const admin = getSupabaseAdmin()

  const succeeded = result.actionResults.filter(r => r.success).length
  const failed = result.actionResults.filter(r => !r.success).length

  // Insert run log
  await admin.from('flow_run_log').insert({
    rule_id: result.ruleId,
    board_id: context.board.id,
    card_id: context.card.id,
    triggered_by: context.event.triggeredBy || null,
    status: result.status,
    actions_total: result.actionResults.length,
    actions_succeeded: succeeded,
    actions_failed: failed,
    action_results: result.actionResults,
    error_message: result.actionResults.find(r => r.error)?.error ?? null,
    duration_ms: result.durationMs,
  })

  // Update rule counters
  await admin.rpc('increment_flow_rule_run_count', {
    rule_id: result.ruleId,
    new_status: result.status,
  }).then(({ error }) => {
    // Fallback: if RPC doesn't exist, update directly
    if (error) {
      return admin
        .from('flow_rules')
        .update({
          run_count: context.rule.runCount + 1,
          last_run_at: new Date().toISOString(),
          last_run_status: result.status,
        })
        .eq('id', result.ruleId)
    }
  })
}

/**
 * Fetch card data from the database.
 */
async function fetchCardData(cardId: string, boardId: string): Promise<CardData | null> {
  const admin = getSupabaseAdmin()

  const { data: project, error } = await admin
    .from('projects')
    .select('*')
    .eq('id', cardId)
    .single()

  if (error || !project) return null

  // Fetch assignees
  const { data: assignments } = await admin
    .from('project_assignments')
    .select('user_id')
    .eq('project_id', cardId)

  const assigneeIds = (assignments ?? []).map((a: { user_id: string }) => a.user_id)

  let assignees: Array<{ id: string; name: string; email: string }> = []
  if (assigneeIds.length > 0) {
    const { data: profiles } = await admin
      .from('user_roles')
      .select('user_id, first_name, last_name, email')
      .eq('business_id', boardId)
      .in('user_id', assigneeIds)

    assignees = (profiles ?? []).map((p: { user_id: string; first_name: string; last_name: string; email: string }) => ({
      id: p.user_id,
      name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email,
      email: p.email,
    }))
  }

  return {
    id: project.id,
    title: project.title,
    description: project.description ?? undefined,
    status: project.status,
    priority: project.priority ?? 'medium',
    dueDate: project.due_date ?? undefined,
    startDate: project.start_date ?? undefined,
    clientName: project.client_name ?? undefined,
    clientEmail: project.client_email ?? undefined,
    clientPhone: project.client_phone ?? undefined,
    assignees,
    primaryOwnerId: project.primary_owner_id ?? undefined,
    createdBy: project.created_by ?? undefined,
    tags: [], // Tags are not yet a separate table — will be card-level metadata
    customFields: {},
    businessId: project.business_id,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }
}

/**
 * Fetch board data from the database.
 */
async function fetchBoardData(boardId: string): Promise<BoardData | null> {
  const admin = getSupabaseAdmin()

  const { data: business } = await admin
    .from('businesses')
    .select('id, name')
    .eq('id', boardId)
    .single()

  if (!business) return null

  const { data: statuses } = await admin
    .from('project_statuses')
    .select('id, label, color_key')
    .eq('business_id', boardId)
    .order('order_index')

  return {
    id: business.id,
    name: business.name ?? 'Workspace',
    columns: (statuses ?? []).map((s: { id: string; label: string; color_key: string }) => ({
      id: s.label.toLowerCase(),
      label: s.label,
      colorKey: s.color_key,
    })),
    workspaceId: boardId,
  }
}
