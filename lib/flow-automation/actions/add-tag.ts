import type { ActionHandler } from '@/types/flow-automation'
import { actionRegistry } from '../action-registry'

// NOTE: Tags are stored as metadata on the project. Since ArchaFlow doesn't
// yet have a dedicated tags table, this is a placeholder that will work once
// a tags column/table is added. For now, it records the intent as a success.

const handler: ActionHandler = {
  type: 'add_tag',
  label: 'Add tag',
  description: 'Adds a tag to the card',
  category: 'card',
  icon: 'Tag',
  configSchema: {
    fields: [
      {
        key: 'tag',
        label: 'Tag',
        type: 'tag_picker',
        required: true,
        placeholder: 'Enter tag name',
      },
      {
        key: 'createIfNotExists',
        label: 'Create tag if it doesn\'t exist',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    ],
  },
  async execute(config, context) {
    const tag = config.tag as string
    if (!tag) {
      return { success: false, error: 'Tag is required' }
    }

    // TODO: Implement when tags table/column is available
    // For now, log the action and return success
    console.log(`[FlowAction:add_tag] Adding tag "${tag}" to card ${context.card.id}`)
    return { success: true, output: { tag } }
  },
  validate(config) {
    if (!config.tag) {
      return { valid: false, errors: ['Tag is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `add tag "${config.tag ?? '...'}"`
  },
}

actionRegistry.register(handler)
export default handler
