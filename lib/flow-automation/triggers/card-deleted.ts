import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_deleted',
  label: 'Card deleted',
  description: 'Triggers when a card is deleted',
  icon: 'Trash2',
  configSchema: { fields: [] },
  matches(event: KanbanEvent): boolean {
    return event.type === 'card_deleted'
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'a card is deleted'
  },
}

triggerRegistry.register(handler)
export default handler
