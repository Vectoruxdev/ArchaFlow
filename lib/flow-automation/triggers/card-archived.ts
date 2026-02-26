import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_archived',
  label: 'Card archived',
  description: 'Triggers when a card is archived',
  icon: 'Archive',
  configSchema: { fields: [] },
  matches(event: KanbanEvent): boolean {
    return event.type === 'card_archived'
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'a card is archived'
  },
}

triggerRegistry.register(handler)
export default handler
