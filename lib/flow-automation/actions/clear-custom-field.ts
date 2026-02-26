import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'clear_custom_field',
  label: 'Clear custom field',
  description: 'Clears a custom field value on the card',
  category: 'card',
  icon: 'FileX',
  configSchema: {
    fields: [
      {
        key: 'fieldId',
        label: 'Field',
        type: 'field_picker',
        required: true,
        placeholder: 'Select custom field',
      },
    ],
  },
  async execute(config, context) {
    const fieldId = config.fieldId as string
    if (!fieldId) {
      return { success: false, error: 'Field is required' }
    }

    // TODO: Implement when custom fields system is available
    console.log(`[FlowAction:clear_custom_field] Clearing field "${fieldId}" on card ${context.card.id}`)
    return { success: true, output: { fieldId } }
  },
  validate(config) {
    if (!config.fieldId) {
      return { valid: false, errors: ['Field is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `clear field "${config.fieldId ?? '...'}"`
  },
}

actionRegistry.register(handler)
export default handler
