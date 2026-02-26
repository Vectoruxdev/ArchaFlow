import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'create_subtask_set',
  label: 'Create subtask checklist',
  description: 'Creates multiple subtasks from a predefined checklist',
  category: 'subtask',
  icon: 'ListChecks',
  configSchema: {
    fields: [
      {
        key: 'subtasks',
        label: 'Subtasks',
        type: 'textarea',
        required: true,
        supportsVariables: true,
        placeholder: 'One subtask per line:\nReview contract\nSchedule kickoff meeting\nSend welcome packet',
        helpText: 'Enter one subtask per line',
      },
    ],
  },
  async execute(config, context) {
    // Parse subtasks from newline-delimited text
    const subtasksText = config.subtasks as string
    if (!subtasksText) {
      return { success: false, error: 'Subtasks list is required' }
    }

    const subtaskTitles = subtasksText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    if (subtaskTitles.length === 0) {
      return { success: false, error: 'At least one subtask is required' }
    }

    const admin = getSupabaseAdmin()
    const inserts = subtaskTitles.map((title, index) => ({
      project_id: context.card.id,
      title,
      order_index: index,
    }))

    const { data, error } = await admin
      .from('project_tasks')
      .insert(inserts)
      .select('id')

    if (error) {
      return { success: false, error: error.message }
    }

    const subtaskIds = (data ?? []).map((d: { id: string }) => d.id)
    return { success: true, output: { subtaskIds, count: subtaskIds.length } }
  },
  validate(config) {
    if (!config.subtasks) {
      return { valid: false, errors: ['Subtasks list is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    const text = (config.subtasks as string) ?? ''
    const count = text.split('\n').filter(s => s.trim()).length
    return `create ${count} subtask${count !== 1 ? 's' : ''}`
  },
}

actionRegistry.register(handler)
export default handler
