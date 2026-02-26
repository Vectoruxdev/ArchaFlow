import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'unassign_user',
  label: 'Unassign current user',
  description: 'Removes the current assignee from the card',
  category: 'card',
  icon: 'UserMinus',
  configSchema: { fields: [] },
  async execute(_config, context) {
    const admin = getSupabaseAdmin()

    const { error } = await admin
      .from('project_assignments')
      .delete()
      .eq('project_id', context.card.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'unassign all users from card'
  },
}

actionRegistry.register(handler)
export default handler
