import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_tag_removed',
  label: 'Card tag removed',
  description: 'Triggers when a specific tag is removed from a card',
  icon: 'TagX',
  configSchema: {
    fields: [
      {
        key: 'tag',
        label: 'Tag',
        type: 'tag_picker',
        required: true,
        placeholder: 'Select or enter tag',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_tag_removed') return false
    if (config.tag) {
      return event.payload?.tag === config.tag
    }
    return true
  },
  validate(config: Record<string, unknown>) {
    if (!config.tag) {
      return { valid: false, errors: ['Tag is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `tag "${config.tag ?? '...'}" is removed from a card`
  },
}

triggerRegistry.register(handler)
export default handler
