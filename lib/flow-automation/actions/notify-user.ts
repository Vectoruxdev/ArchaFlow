import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'notify_user',
  label: 'Notify specific user(s)',
  description: 'Sends an in-app notification to selected users',
  category: 'notification',
  icon: 'Bell',
  configSchema: {
    fields: [
      {
        key: 'userIds',
        label: 'Users to notify',
        type: 'multi_select',
        required: true,
        placeholder: 'Select users',
      },
      {
        key: 'message',
        label: 'Message',
        type: 'textarea',
        required: true,
        supportsVariables: true,
        placeholder: 'Notification message. Use {{variables}} for dynamic content.',
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
    const userIds = config.userIds as string[]
    const message = config.message as string

    if (!userIds || userIds.length === 0) {
      return { success: false, error: 'At least one user is required' }
    }
    if (!message) {
      return { success: false, error: 'Message is required' }
    }

    const admin = getSupabaseAdmin()

    // Insert activity notifications for each user
    const notifications = userIds.map(userId => ({
      business_id: context.board.workspaceId,
      user_id: userId,
      activity_type: 'flow_automation',
      message: `[${context.rule.name}] ${message}`,
      entity_type: 'project',
      entity_id: context.card.id,
      metadata: {
        ruleId: context.rule.id,
        ruleName: context.rule.name,
        cardTitle: context.card.title,
      },
    }))

    const { error } = await admin
      .from('workspace_activities')
      .insert(notifications)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { notifiedCount: userIds.length } }
  },
  validate(config) {
    const errors: string[] = []
    if (!config.userIds || (Array.isArray(config.userIds) && config.userIds.length === 0)) {
      errors.push('At least one user is required')
    }
    if (!config.message) errors.push('Message is required')
    return { valid: errors.length === 0, errors }
  },
  summarize(config) {
    const count = Array.isArray(config.userIds) ? config.userIds.length : 0
    return `notify ${count} user${count !== 1 ? 's' : ''}`
  },
}

actionRegistry.register(handler)
export default handler
