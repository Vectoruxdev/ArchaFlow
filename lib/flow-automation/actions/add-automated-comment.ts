import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'add_automated_comment',
  label: 'Add automated comment',
  description: 'Adds a comment to the card from "Archaflow Automation"',
  category: 'card',
  icon: 'MessageSquare',
  configSchema: {
    fields: [
      {
        key: 'text',
        label: 'Comment text',
        type: 'textarea',
        required: true,
        supportsVariables: true,
        placeholder: 'Enter comment text. Use {{variables}} for dynamic content.',
      },
    ],
  },
  async execute(config, context) {
    const text = config.text as string
    if (!text) {
      return { success: false, error: 'Comment text is required' }
    }

    const admin = getSupabaseAdmin()

    // Insert into project_notes (general notes on the project)
    const { data, error } = await admin
      .from('project_notes')
      .insert({
        project_id: context.card.id,
        author_id: null, // System-generated (no user author)
        content: `[Automation: ${context.rule.name}] ${text}`,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { commentId: data?.id } }
  },
  validate(config) {
    if (!config.text) {
      return { valid: false, errors: ['Comment text is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    const text = (config.text as string) ?? ''
    const preview = text.length > 40 ? text.slice(0, 40) + '...' : text
    return `add comment "${preview}"`
  },
}

actionRegistry.register(handler)
export default handler
