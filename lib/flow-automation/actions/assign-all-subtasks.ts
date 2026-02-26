import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'assign_all_subtasks',
  label: 'Assign all subtasks to user',
  description: 'Assigns all incomplete subtasks to a specific user',
  category: 'subtask',
  icon: 'UserCheck',
  configSchema: {
    fields: [
      {
        key: 'userId',
        label: 'Assign to',
        type: 'user_picker',
        required: true,
        placeholder: 'Select user',
      },
    ],
  },
  async execute(config, context) {
    const userId = config.userId as string
    if (!userId) {
      return { success: false, error: 'User is required' }
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('project_tasks')
      .update({ assigned_to: userId })
      .eq('project_id', context.card.id)
      .eq('completed', false)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { assignedTo: userId } }
  },
  validate(config) {
    if (!config.userId) {
      return { valid: false, errors: ['User is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'assign all subtasks to user'
  },
}

actionRegistry.register(handler)
export default handler
