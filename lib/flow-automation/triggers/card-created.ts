import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_created',
  label: 'Card created',
  description: 'Triggers when a new card is created, optionally in a specific column',
  icon: 'Plus',
  configSchema: {
    fields: [
      {
        key: 'columnId',
        label: 'In column (optional)',
        type: 'column_picker',
        required: false,
        placeholder: 'Any column',
        helpText: 'Leave blank to trigger for any column',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_created') return false
    if (config.columnId) {
      return event.payload?.columnId === config.columnId
    }
    return true
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize(config, boardContext) {
    if (config.columnId) {
      const col = boardContext?.columns.find(c => c.id === config.columnId)
      return `card is created in ${col?.label ?? 'a column'}`
    }
    return 'a new card is created'
  },
}

triggerRegistry.register(handler)
export default handler
