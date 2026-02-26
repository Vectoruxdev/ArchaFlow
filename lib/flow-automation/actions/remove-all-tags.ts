import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'remove_all_tags',
  label: 'Remove all tags',
  description: 'Removes all tags from the card',
  category: 'card',
  icon: 'XCircle',
  configSchema: { fields: [] },
  async execute(_config, context) {
    // TODO: Implement when tags table/column is available
    console.log(`[FlowAction:remove_all_tags] Removing all tags from card ${context.card.id}`)
    return { success: true }
  },
  validate() {
    return { valid: true, errors: [] }
  },
  summarize() {
    return 'remove all tags'
  },
}

actionRegistry.register(handler)
export default handler
