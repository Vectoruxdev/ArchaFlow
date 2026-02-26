import type { TriggerHandler, KanbanEvent } from '@/types/flow-automation'
import { triggerRegistry } from '../trigger-registry'

const handler: TriggerHandler = {
  type: 'card_field_changed',
  label: 'Custom field changed',
  description: 'Triggers when a specific custom field is changed on a card',
  icon: 'FileEdit',
  configSchema: {
    fields: [
      {
        key: 'fieldId',
        label: 'Field',
        type: 'field_picker',
        required: true,
        placeholder: 'Select field',
      },
      {
        key: 'fromValue',
        label: 'From value (optional)',
        type: 'text',
        required: false,
        placeholder: 'Any value',
      },
      {
        key: 'toValue',
        label: 'To value (optional)',
        type: 'text',
        required: false,
        placeholder: 'Any value',
      },
    ],
  },
  matches(event: KanbanEvent, config: Record<string, unknown>): boolean {
    if (event.type !== 'card_field_changed') return false
    if (config.fieldId && event.payload?.fieldId !== config.fieldId) return false
    if (config.fromValue && event.payload?.fromValue !== config.fromValue) return false
    if (config.toValue && event.payload?.toValue !== config.toValue) return false
    return true
  },
  validate(config: Record<string, unknown>) {
    if (!config.fieldId) {
      return { valid: false, errors: ['Field is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    const parts = [`field "${config.fieldId ?? '...'}" changes`]
    if (config.toValue) parts.push(`to "${config.toValue}"`)
    return parts.join(' ')
  },
}

triggerRegistry.register(handler)
export default handler
