import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'notify_card_assignee',
  label: 'Notify card assignee',
  description: 'Sends a notification to whoever is assigned to the card',
  category: 'notification',
  icon: 'BellRing',
  configSchema: {
    fields: [
      {
        key: 'message',
        label: 'Message',
        type: 'textarea',
        required: true,
        supportsVariables: true,
        placeholder: 'Notification message',
      },
      {
        key: 'linkToCard',
        label: 'Include link to card',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    ],
  },
  async execute(config, context) {
    const message = config.message as string
    if (!message) {
      return { success: false, error: 'Message is required' }
    }

    const assignee = context.card.assignees?.[0]
    if (!assignee) {
      // Graceful no-op if no assignee
      console.warn(`[FlowAction:notify_card_assignee] Card ${context.card.id} has no assignee — skipping`)
      return { success: true, details: 'No assignee on card — skipped' }
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('workspace_activities')
      .insert({
        business_id: context.board.workspaceId,
        user_id: assignee.id,
        activity_type: 'flow_automation',
        message: `[${context.rule.name}] ${message}`,
        entity_type: 'project',
        entity_id: context.card.id,
        metadata: {
          ruleId: context.rule.id,
          cardTitle: context.card.title,
        },
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { notifiedUserId: assignee.id } }
  },
  validate(config) {
    if (!config.message) {
      return { valid: false, errors: ['Message is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'notify card assignee'
  },
}

actionRegistry.register(handler)
export default handler
