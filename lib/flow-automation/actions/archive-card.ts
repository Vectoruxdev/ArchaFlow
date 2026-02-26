import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'archive_card',
  label: 'Archive card',
  description: 'Archives the card',
  category: 'card',
  icon: 'Archive',
  configSchema: { fields: [] },
  async execute(_config, context) {
    const admin = getSupabaseAdmin()

    const { error } = await admin
      .from('projects')
      .update({ archived_at: new Date().toISOString() })
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
    return 'archive the card'
  },
}

actionRegistry.register(handler)
export default handler
