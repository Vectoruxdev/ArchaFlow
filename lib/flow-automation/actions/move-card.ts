import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'move_card',
  label: 'Move card to column',
  description: 'Moves the card to a specific column',
  category: 'card',
  icon: 'ArrowRight',
  configSchema: {
    fields: [
      {
        key: 'targetColumnId',
        label: 'Target column',
        type: 'column_picker',
        required: true,
        placeholder: 'Select column',
      },
    ],
  },
  async execute(config, context) {
    const targetColumnId = config.targetColumnId as string
    if (!targetColumnId) {
      return { success: false, error: 'Target column is required' }
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('projects')
      .update({ status: targetColumnId })
      .eq('id', context.card.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { movedTo: targetColumnId } }
  },
  validate(config) {
    if (!config.targetColumnId) {
      return { valid: false, errors: ['Target column is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config, boardContext) {
    const col = boardContext?.columns.find(c => c.id === config.targetColumnId)
    return `move card to ${col?.label ?? 'a column'}`
  },
}

actionRegistry.register(handler)
export default handler
