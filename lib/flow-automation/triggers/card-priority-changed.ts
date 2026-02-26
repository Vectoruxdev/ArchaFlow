import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_priority_changed',
  label: 'Card priority changed',
  description: 'Triggers when a card\'s priority is changed',
  icon: 'AlertTriangle',
  configSchema: {
    fields: [
      {
        key: 'fromPriority',
        label: 'From priority (optional)',
        type: 'priority_picker',
        required: false,
        placeholder: 'Any',
      },
      {
        key: 'toPriority',
        label: 'To priority (optional)',
        type: 'priority_picker',
        required: false,
        placeholder: 'Any',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_priority_changed') return false
    if (config.fromPriority && event.payload?.fromPriority !== config.fromPriority) return false
    if (config.toPriority && event.payload?.toPriority !== config.toPriority) return false
    return true
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize(config) {
    const parts: string[] = []
    if (config.fromPriority) parts.push(`from ${config.fromPriority}`)
    if (config.toPriority) parts.push(`to ${config.toPriority}`)
    if (parts.length > 0) {
      return `card priority changes ${parts.join(' ')}`
    }
    return 'card priority changes'
  },
}

triggerRegistry.register(handler)
export default handler
