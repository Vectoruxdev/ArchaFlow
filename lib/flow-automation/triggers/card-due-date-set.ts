import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_due_date_set',
  label: 'Card due date set',
  description: 'Triggers when a due date is set or changed on a card',
  icon: 'CalendarPlus',
  configSchema: { fields: [] },
  matches(event: KanbanEvent): boolean {
    return event.type === 'card_due_date_set'
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'a due date is set on a card'
  },
}

triggerRegistry.register(handler)
export default handler
