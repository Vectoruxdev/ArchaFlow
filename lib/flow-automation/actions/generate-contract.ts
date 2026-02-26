import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'generate_contract',
  label: 'Generate contract',
  description: 'Creates a draft contract from a template, pre-filled from card data',
  category: 'contracts',
  icon: 'FileSignature',
  configSchema: {
    fields: [
      {
        key: 'templateId',
        label: 'Contract template',
        type: 'select',
        required: true,
        placeholder: 'Select template',
      },
      {
        key: 'prefillFromCard',
        label: 'Pre-fill from card data',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    ],
    comingSoon: true,
  },
  async execute(_config, _context) {
    // CONTRACT_MODULE_NOT_IMPLEMENTED — stub for Phase 2
    return {
      success: false,
      error: 'CONTRACT_MODULE_NOT_IMPLEMENTED',
      details: 'Contract generation will be available when the Contracts module is extended with template-based generation.',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `generate contract from template`
  },
}

actionRegistry.register(handler)
export default handler
