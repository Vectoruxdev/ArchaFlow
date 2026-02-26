import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'ai_classify_card',
  label: 'AI: Classify card',
  description: 'Uses AI to classify the card into categories and set a custom field',
  category: 'ai',
  icon: 'Brain',
  configSchema: {
    fields: [
      {
        key: 'categories',
        label: 'Categories',
        type: 'textarea',
        required: true,
        placeholder: 'One category per line:\nResidential\nCommercial\nRenovation\nNew Build',
        helpText: 'Enter one category per line',
      },
      {
        key: 'targetFieldId',
        label: 'Save classification to field',
        type: 'field_picker',
        required: true,
      },
    ],
    comingSoon: true,
  },
  async execute() {
    return {
      success: false,
      error: 'AI_ACTIONS_PHASE_2',
      details: 'AI classification will be available when AI Map integration is ready.',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'AI classify card into categories'
  },
}

actionRegistry.register(handler)
export default handler
