import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_assignee_removed',
  label: 'Card assignee removed',
  description: 'Triggers when a user is unassigned from a card',
  icon: 'UserMinus',
  configSchema: {
    fields: [
      {
        key: 'userId',
        label: 'Specific user (optional)',
        type: 'user_picker',
        required: false,
        placeholder: 'Any user',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_assignee_removed') return false
    if (config.userId) {
      return event.payload?.removedUserId === config.userId
    }
    return true
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize(config) {
    if (config.userId) return 'a specific user is unassigned from a card'
    return 'a user is unassigned from a card'
  },
}

triggerRegistry.register(handler)
export default handler
