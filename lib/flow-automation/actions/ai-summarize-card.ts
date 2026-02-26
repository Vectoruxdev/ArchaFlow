import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'ai_summarize_card',
  label: 'AI: Summarize card',
  description: 'Uses AI to summarize the card\'s title, description, and comments',
  category: 'ai',
  icon: 'Sparkles',
  configSchema: {
    fields: [
      {
        key: 'saveToField',
        label: 'Save to field (optional)',
        type: 'field_picker',
        required: false,
        helpText: 'Custom field to save the summary to',
      },
      {
        key: 'saveAsComment',
        label: 'Save as comment',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      {
        key: 'promptOverride',
        label: 'Custom prompt (optional)',
        type: 'textarea',
        required: false,
        placeholder: 'Leave blank for default summarization prompt',
      },
    ],
    comingSoon: true,
  },
  async execute() {
    return {
      success: false,
      error: 'AI_ACTIONS_PHASE_2',
      details: 'AI summarization will be available when AI Map integration is ready.',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'AI summarize card content'
  },
}

actionRegistry.register(handler)
export default handler
