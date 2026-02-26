import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

// NOTE: This trigger is schedule-based. It should be checked on a cron job
// (e.g., daily) that scans cards with due dates approaching within N days
// and fires synthetic KanbanEvent { type: 'due_date_approaching' } for each.

const handler: TriggerHandler = {
  type: 'due_date_approaching',
  label: 'Due date approaching',
  description: 'Triggers N days before a card\'s due date',
  icon: 'CalendarClock',
  configSchema: {
    fields: [
      {
        key: 'daysBefore',
        label: 'Days before due date',
        type: 'number',
        required: true,
        defaultValue: 2,
        placeholder: '2',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'due_date_approaching') return false
    const daysBefore = Number(config.daysBefore ?? 2)
    const eventDaysBefore = Number(event.payload?.daysBefore ?? 0)
    return eventDaysBefore <= daysBefore
  },
  validate(config: Record<string, unknown>) {
    const days = Number(config.daysBefore)
    if (!config.daysBefore || isNaN(days) || days < 1) {
      return { valid: false, errors: ['Days before must be a positive number'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `due date is ${config.daysBefore ?? 2} days away`
  },
}

triggerRegistry.register(handler)
export default handler
