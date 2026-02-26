import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'set_custom_field',
  label: 'Set custom field value',
  description: 'Sets a custom field value on the card',
  category: 'card',
  icon: 'FileEdit',
  configSchema: {
    fields: [
      {
        key: 'fieldId',
        label: 'Field',
        type: 'field_picker',
        required: true,
        placeholder: 'Select custom field',
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        required: true,
        supportsVariables: true,
        placeholder: 'Enter value',
      },
    ],
  },
  async execute(config, context) {
    const fieldId = config.fieldId as string
    const value = config.value

    if (!fieldId) {
      return { success: false, error: 'Field is required' }
    }

    // TODO: Implement when custom fields system is available
    console.log(`[FlowAction:set_custom_field] Setting field "${fieldId}" = "${value}" on card ${context.card.id}`)
    return { success: true, output: { fieldId, value } }
  },
  validate(config) {
    const errors: string[] = []
    if (!config.fieldId) errors.push('Field is required')
    if (config.value === undefined || config.value === '') errors.push('Value is required')
    return { valid: errors.length === 0, errors }
  },
  summarize(config) {
    return `set field "${config.fieldId ?? '...'}" to "${config.value ?? '...'}"`
  },
}

actionRegistry.register(handler)
export default handler
