import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'set_invoice_status',
  label: 'Set invoice status',
  description: 'Updates an invoice\'s status',
  category: 'invoices',
  icon: 'FileCheck2',
  configSchema: {
    fields: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Sent', value: 'sent' },
          { label: 'Paid', value: 'paid' },
          { label: 'Voided', value: 'voided' },
        ],
      },
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
  summarize(config) {
    return `set invoice status to ${config.status ?? '...'}`
  },
}

actionRegistry.register(handler)
export default handler
