import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_moved_from',
  label: 'Card moved from column',
  description: 'Triggers when a card is moved out of a specific column',
  icon: 'ArrowLeft',
  configSchema: {
    fields: [
      {
        key: 'sourceColumnId',
        label: 'Source column',
        type: 'column_picker',
        required: true,
        placeholder: 'Select column',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_moved') return false
    return event.payload?.fromColumnId === config.sourceColumnId
  },
  validate(config: Record<string, unknown>) {
    if (!config.sourceColumnId) {
      return { valid: false, errors: ['Source column is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config, boardContext) {
    const col = boardContext?.columns.find(c => c.id === config.sourceColumnId)
    return `card moves from ${col?.label ?? 'a column'}`
  },
}

triggerRegistry.register(handler)
export default handler
