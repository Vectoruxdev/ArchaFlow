import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'complete_all_subtasks',
  label: 'Complete all subtasks',
  description: 'Marks all subtasks on the card as completed',
  category: 'subtask',
  icon: 'CheckCheck',
  configSchema: { fields: [] },
  async execute(_config, context) {
    const admin = getSupabaseAdmin()

    const { data, error } = await admin
      .from('project_tasks')
      .update({ completed: true })
      .eq('project_id', context.card.id)
      .eq('completed', false)
      .select('id')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { count: data?.length ?? 0 } }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'complete all subtasks'
  },
}

actionRegistry.register(handler)
export default handler
