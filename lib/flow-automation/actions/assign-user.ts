import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'assign_user',
  label: 'Assign user',
  description: 'Assigns a specific user to the card',
  category: 'card',
  icon: 'UserPlus',
  configSchema: {
    fields: [
      {
        key: 'userId',
        label: 'User',
        type: 'user_picker',
        required: true,
        placeholder: 'Select user',
      },
    ],
  },
  async execute(config, context) {
    const userId = config.userId as string
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const admin = getSupabaseAdmin()

    // Upsert assignment (ignore if already assigned)
    const { error } = await admin
      .from('project_assignments')
      .upsert(
        { project_id: context.card.id, user_id: userId },
        { onConflict: 'project_id,user_id' }
      )

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { assignedUserId: userId } }
  },
  validate(config) {
    if (!config.userId) {
      return { valid: false, errors: ['User is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `assign user to card`
  },
}

actionRegistry.register(handler)
export default handler
