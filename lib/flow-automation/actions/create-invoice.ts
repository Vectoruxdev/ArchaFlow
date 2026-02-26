import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'create_invoice',
  label: 'Create invoice',
  description: 'Creates a draft invoice from a template, linked to the card',
  category: 'invoices',
  icon: 'Receipt',
  configSchema: {
    fields: [
      {
        key: 'templateId',
        label: 'Invoice template',
        type: 'select',
        required: false,
        placeholder: 'Default template',
      },
      {
        key: 'clientFromCard',
        label: 'Use client from card',
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
      error: 'INVOICE_AUTOMATION_NOT_IMPLEMENTED',
      details: 'Automated invoice creation will be available in Phase 2.',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'create invoice from template'
  },
}

actionRegistry.register(handler)
export default handler
