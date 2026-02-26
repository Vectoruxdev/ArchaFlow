import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'set_due_date',
  label: 'Set due date',
  description: 'Sets or updates the card\'s due date',
  category: 'card',
  icon: 'CalendarPlus',
  configSchema: {
    fields: [
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        required: true,
        options: [
          { label: 'Absolute date', value: 'absolute' },
          { label: 'Relative (days from now)', value: 'relative' },
        ],
        defaultValue: 'relative',
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        required: false,
        helpText: 'For absolute mode',
      },
      {
        key: 'offsetDays',
        label: 'Days from now',
        type: 'number',
        required: false,
        defaultValue: 7,
        helpText: 'For relative mode. Positive = future, negative = past.',
      },
      {
        key: 'relativeTo',
        label: 'Relative to',
        type: 'select',
        required: false,
        options: [
          { label: 'Today', value: 'today' },
          { label: 'Trigger date', value: 'trigger_date' },
          { label: 'Current due date', value: 'current_due_date' },
        ],
        defaultValue: 'today',
      },
    ],
  },
  async execute(config, context) {
    let finalDate: string

    if (config.mode === 'absolute') {
      if (!config.date) {
        return { success: false, error: 'Date is required for absolute mode' }
      }
      finalDate = config.date as string
    } else {
      const offsetDays = Number(config.offsetDays ?? 7)
      let baseDate: Date

      switch (config.relativeTo) {
        case 'current_due_date':
          if (!context.card.dueDate) {
            return { success: false, error: 'Card has no current due date' }
          }
          baseDate = new Date(context.card.dueDate)
          break
        case 'trigger_date':
        case 'today':
        default:
          baseDate = new Date()
          break
      }

      baseDate.setDate(baseDate.getDate() + offsetDays)
      finalDate = baseDate.toISOString().split('T')[0]
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('projects')
      .update({ due_date: finalDate })
      .eq('id', context.card.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { dueDate: finalDate } }
  },
  validate(config) {
    if (config.mode === 'absolute' && !config.date) {
      return { valid: false, errors: ['Date is required for absolute mode'] }
    }
    if (config.mode === 'relative' && config.offsetDays === undefined) {
      return { valid: false, errors: ['Offset days is required for relative mode'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    if (config.mode === 'absolute') {
      return `set due date to ${config.date ?? '...'}`
    }
    const days = config.offsetDays ?? 7
    return `set due date to ${days} days from now`
  },
}

actionRegistry.register(handler)
export default handler
