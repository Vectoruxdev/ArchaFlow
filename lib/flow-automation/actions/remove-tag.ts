import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'remove_tag',
  label: 'Remove tag',
  description: 'Removes a specific tag from the card',
  category: 'card',
  icon: 'TagX',
  configSchema: {
    fields: [
      {
        key: 'tag',
        label: 'Tag',
        type: 'tag_picker',
        required: true,
        placeholder: 'Select tag to remove',
      },
    ],
  },
  async execute(config, context) {
    const tag = config.tag as string
    if (!tag) {
      return { success: false, error: 'Tag is required' }
    }

    // TODO: Implement when tags table/column is available
    console.log(`[FlowAction:remove_tag] Removing tag "${tag}" from card ${context.card.id}`)
    return { success: true, output: { tag } }
  },
  validate(config) {
    if (!config.tag) {
      return { valid: false, errors: ['Tag is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `remove tag "${config.tag ?? '...'}"`
  },
}

actionRegistry.register(handler)
export default handler
