import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

// NOTE: This trigger is schedule-based. It should be checked on a cron job
// (e.g., daily) that scans cards with past due dates and fires synthetic
// KanbanEvent { type: 'due_date_passed' } for each.

const handler: TriggerHandler = {
  type: 'due_date_passed',
  label: 'Due date passed',
  description: 'Triggers when a card\'s due date has passed (overdue)',
  icon: 'CalendarX',
  configSchema: { fields: [] },
  matches(event: KanbanEvent): boolean {
    return event.type === 'due_date_passed'
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'a card becomes overdue'
  },
}

triggerRegistry.register(handler)
export default handler
