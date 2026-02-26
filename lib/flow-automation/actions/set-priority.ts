import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'set_priority',
  label: 'Set priority',
  description: 'Changes the card\'s priority level',
  category: 'card',
  icon: 'AlertTriangle',
  configSchema: {
    fields: [
      {
        key: 'priority',
        label: 'Priority',
        type: 'priority_picker',
        required: true,
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    ],
  },
  async execute(config, context) {
    const priority = config.priority as string
    if (!priority) {
      return { success: false, error: 'Priority is required' }
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('projects')
      .update({ priority })
      .eq('id', context.card.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { priority } }
  },
  validate(config) {
    if (!config.priority) {
      return { valid: false, errors: ['Priority is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `set priority to ${config.priority ?? '...'}`
  },
}

actionRegistry.register(handler)
export default handler
