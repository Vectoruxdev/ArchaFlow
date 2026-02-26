import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'notify_team',
  label: 'Notify team',
  description: 'Sends a notification to all members of a team',
  category: 'notification',
  icon: 'Users',
  configSchema: {
    fields: [
      {
        key: 'teamId',
        label: 'Team',
        type: 'team_picker',
        required: false,
        placeholder: 'All workspace members',
        helpText: 'Leave blank to notify all workspace members',
      },
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

    const admin = getSupabaseAdmin()

    // Fetch team or all workspace members
    const { data: members, error: fetchError } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('business_id', context.board.workspaceId)

    if (fetchError || !members || members.length === 0) {
      return { success: false, error: 'No team members found' }
    }

    const notifications = members.map((m: { user_id: string }) => ({
      business_id: context.board.workspaceId,
      user_id: m.user_id,
      activity_type: 'flow_automation',
      message: `[${context.rule.name}] ${message}`,
      entity_type: 'project',
      entity_id: context.card.id,
      metadata: {
        ruleId: context.rule.id,
        cardTitle: context.card.title,
      },
    }))

    const { error } = await admin
      .from('workspace_activities')
      .insert(notifications)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { notifiedCount: members.length } }
  },
  validate(config) {
    if (!config.message) {
      return { valid: false, errors: ['Message is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'notify all team members'
  },
}

actionRegistry.register(handler)
export default handler
