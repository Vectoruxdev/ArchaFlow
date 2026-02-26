import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_moved_to',
  label: 'Card moved to column',
  description: 'Triggers when a card is moved into a specific column',
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
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_moved') return false
    return event.payload?.toColumnId === config.targetColumnId
  },
  validate(config: Record<string, unknown>) {
    if (!config.targetColumnId) {
      return { valid: false, errors: ['Target column is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config, boardContext) {
    const col = boardContext?.columns.find(c => c.id === config.targetColumnId)
    return `card moves to ${col?.label ?? 'a column'}`
  },
}

triggerRegistry.register(handler)
export default handler
