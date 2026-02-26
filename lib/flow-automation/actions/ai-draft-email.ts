import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'ai_draft_email',
  label: 'AI: Draft follow-up email',
  description: 'Uses AI to draft a follow-up email based on card context',
  category: 'ai',
  icon: 'MailPlus',
  configSchema: {
    fields: [
      {
        key: 'promptTemplate',
        label: 'Prompt / instructions',
        type: 'textarea',
        required: false,
        supportsVariables: true,
        placeholder: 'Draft a professional follow-up email about {{card.title}}...',
      },
      {
        key: 'saveToField',
        label: 'Save to field (optional)',
        type: 'field_picker',
        required: false,
      },
      {
        key: 'saveAsComment',
        label: 'Save as comment',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    ],
    comingSoon: true,
  },
  async execute() {
    return {
      success: false,
      error: 'AI_ACTIONS_PHASE_2',
      details: 'AI email drafting will be available when AI Map integration is ready.',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'AI draft follow-up email'
  },
}

actionRegistry.register(handler)
export default handler
