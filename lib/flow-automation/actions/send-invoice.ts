import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'send_invoice',
  label: 'Send invoice',
  description: 'Sends an invoice to the card\'s contact',
  category: 'invoices',
  icon: 'SendHorizontal',
  configSchema: {
    fields: [
      {
        key: 'useStepOutput',
        label: 'Use invoice from previous step',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      {
        key: 'stepIndex',
        label: 'Step number',
        type: 'number',
        required: false,
        defaultValue: 0,
      },
      {
        key: 'message',
        label: 'Message to recipient',
        type: 'textarea',
        required: false,
        supportsVariables: true,
      },
    ],
    comingSoon: true,
  },
  async execute() {
    return {
      success: false,
      error: 'INVOICE_AUTOMATION_NOT_IMPLEMENTED',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'send invoice to contact'
  },
}

actionRegistry.register(handler)
export default handler
