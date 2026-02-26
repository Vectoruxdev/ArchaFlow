import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

// NOTE: This trigger is schedule-based. It should be checked on a cron job
// (e.g., daily) that scans for cards that haven't moved columns in N days
// and fires synthetic KanbanEvent { type: 'card_stuck_in_column' } for each.

const handler: TriggerHandler = {
  type: 'card_stuck_in_column',
  label: 'Card stuck in column',
  description: 'Triggers when a card has been in a column for N days without movement',
  icon: 'Timer',
  configSchema: {
    fields: [
      {
        key: 'columnId',
        label: 'Column (optional)',
        type: 'column_picker',
        required: false,
        placeholder: 'Any column',
        helpText: 'Leave blank to check all columns',
      },
      {
        key: 'days',
        label: 'Days without movement',
        type: 'number',
        required: true,
        defaultValue: 3,
        placeholder: '3',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_stuck_in_column') return false
    if (config.columnId && event.payload?.columnId !== config.columnId) return false
    const configDays = Number(config.days ?? 3)
    const stuckDays = Number(event.payload?.daysInColumn ?? 0)
    return stuckDays >= configDays
  },
  validate(config: Record<string, unknown>) {
    const days = Number(config.days)
    if (!config.days || isNaN(days) || days < 1) {
      return { valid: false, errors: ['Days must be a positive number'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config, boardContext) {
    const days = config.days ?? 3
    if (config.columnId) {
      const col = boardContext?.columns.find(c => c.id === config.columnId)
      return `card is stuck in ${col?.label ?? 'a column'} for ${days} days`
    }
    return `card is stuck in any column for ${days} days`
  },
}

triggerRegistry.register(handler)
export default handler
