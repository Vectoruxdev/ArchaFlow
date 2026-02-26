import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_assignee_set',
  label: 'Card assignee set',
  description: 'Triggers when a user is assigned to a card',
  icon: 'UserPlus',
  configSchema: {
    fields: [
      {
        key: 'userId',
        label: 'Specific user (optional)',
        type: 'user_picker',
        required: false,
        placeholder: 'Any user',
        helpText: 'Leave blank to trigger for any assignee',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_assignee_set') return false
    if (config.userId) {
      return event.payload?.assigneeId === config.userId
    }
    return true
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize(config) {
    if (config.userId) {
      return 'a specific user is assigned to a card'
    }
    return 'a user is assigned to a card'
  },
}

triggerRegistry.register(handler)
export default handler
