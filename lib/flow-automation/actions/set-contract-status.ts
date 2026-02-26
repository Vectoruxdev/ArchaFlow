import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'set_contract_status',
  label: 'Set contract status',
  description: 'Updates a contract\'s status (Draft, Sent, Signed, Voided)',
  category: 'contracts',
  icon: 'FileCheck',
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
          { label: 'Signed', value: 'signed' },
          { label: 'Voided', value: 'voided' },
        ],
      },
      {
        key: 'useStepOutput',
        label: 'Use contract from previous step',
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
      error: 'CONTRACT_MODULE_NOT_IMPLEMENTED',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `set contract status to ${config.status ?? '...'}`
  },
}

actionRegistry.register(handler)
export default handler
