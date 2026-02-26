import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'clear_due_date',
  label: 'Clear due date',
  description: 'Removes the due date from the card',
  category: 'card',
  icon: 'CalendarX',
  configSchema: { fields: [] },
  async execute(_config, context) {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('projects')
      .update({ due_date: null })
      .eq('id', context.card.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'clear due date'
  },
}

actionRegistry.register(handler)
export default handler
