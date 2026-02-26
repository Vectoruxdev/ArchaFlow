import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_moved_between',
  label: 'Card moved between columns',
  description: 'Triggers when a card is moved from one specific column to another',
  icon: 'ArrowLeftRight',
  configSchema: {
    fields: [
      {
        key: 'fromColumnId',
        label: 'From column',
        type: 'column_picker',
        required: true,
        placeholder: 'Select source column',
      },
      {
        key: 'toColumnId',
        label: 'To column',
        type: 'column_picker',
        required: true,
        placeholder: 'Select destination column',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_moved') return false
    return (
      event.payload?.fromColumnId === config.fromColumnId &&
      event.payload?.toColumnId === config.toColumnId
    )
  },
  validate(config: Record<string, unknown>) {
    const errors: string[] = []
    if (!config.fromColumnId) errors.push('Source column is required')
    if (!config.toColumnId) errors.push('Destination column is required')
    return { valid: errors.length === 0, errors }
  },
  summarize(config, boardContext) {
    const from = boardContext?.columns.find(c => c.id === config.fromColumnId)
    const to = boardContext?.columns.find(c => c.id === config.toColumnId)
    return `card moves from ${from?.label ?? 'a column'} to ${to?.label ?? 'a column'}`
  },
}

triggerRegistry.register(handler)
export default handler
