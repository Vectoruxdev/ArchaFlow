import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'create_subtask',
  label: 'Create subtask',
  description: 'Adds a new subtask to the card',
  category: 'subtask',
  icon: 'ListPlus',
  configSchema: {
    fields: [
      {
        key: 'title',
        label: 'Title',
        type: 'text',
        required: true,
        supportsVariables: true,
        placeholder: 'Subtask title',
      },
      {
        key: 'assigneeId',
        label: 'Assignee (optional)',
        type: 'user_picker',
        required: false,
      },
      {
        key: 'description',
        label: 'Description (optional)',
        type: 'textarea',
        required: false,
        supportsVariables: true,
      },
      {
        key: 'dueDateMode',
        label: 'Due date',
        type: 'select',
        required: false,
        options: [
          { label: 'No due date', value: 'none' },
          { label: 'Specific date', value: 'absolute' },
          { label: 'Relative to today', value: 'relative' },
        ],
        defaultValue: 'none',
      },
      {
        key: 'dueDate',
        label: 'Date',
        type: 'date',
        required: false,
        helpText: 'For absolute mode',
      },
      {
        key: 'offsetDays',
        label: 'Days from today',
        type: 'number',
        required: false,
        helpText: 'For relative mode',
      },
    ],
  },
  async execute(config, context) {
    const title = config.title as string
    if (!title) {
      return { success: false, error: 'Title is required' }
    }

    let dueDate: string | null = null
    if (config.dueDateMode === 'absolute' && config.dueDate) {
      dueDate = config.dueDate as string
    } else if (config.dueDateMode === 'relative' && config.offsetDays) {
      const d = new Date()
      d.setDate(d.getDate() + Number(config.offsetDays))
      dueDate = d.toISOString().split('T')[0]
    }

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('project_tasks')
      .insert({
        project_id: context.card.id,
        title,
        description: (config.description as string) || null,
        assigned_to: (config.assigneeId as string) || null,
        due_date: dueDate,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, output: { subtaskId: data?.id, subtaskTitle: title } }
  },
  validate(config) {
    if (!config.title) {
      return { valid: false, errors: ['Title is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config) {
    return `create subtask "${config.title ?? '...'}"`
  },
}

actionRegistry.register(handler)
export default handler
