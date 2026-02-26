import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'send_contract',
  label: 'Send contract for signature',
  description: 'Sends a contract for e-signature to the card\'s contact',
  category: 'contracts',
  icon: 'Send',
  configSchema: {
    fields: [
      {
        key: 'useStepOutput',
        label: 'Use contract from previous step',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      {
        key: 'stepIndex',
        label: 'Step number (0-based)',
        type: 'number',
        required: false,
        defaultValue: 0,
        helpText: 'Which previous step\'s output to get the contractId from',
      },
      {
        key: 'contractId',
        label: 'Contract ID (manual)',
        type: 'text',
        required: false,
        helpText: 'Only needed if not using step output',
      },
      {
        key: 'message',
        label: 'Message to signer',
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
      error: 'CONTRACT_MODULE_NOT_IMPLEMENTED',
      details: 'Contract sending will be available when the Contracts module is extended.',
    }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'send contract for signature'
  },
}

actionRegistry.register(handler)
export default handler
