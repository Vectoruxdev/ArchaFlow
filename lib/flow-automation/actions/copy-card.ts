import type { ActionHandler } from '@/types/flow-automation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { actionRegistry } from '../action-registry'

const handler: ActionHandler = {
  type: 'copy_card',
  label: 'Copy card',
  description: 'Creates a copy of the card in a specified column',
  category: 'card',
  icon: 'Copy',
  configSchema: {
    fields: [
      {
        key: 'targetColumnId',
        label: 'Destination column',
        type: 'column_picker',
        required: true,
        placeholder: 'Select column',
      },
      {
        key: 'copySubtasks',
        label: 'Copy subtasks',
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
    ],
  },
  async execute(config, context) {
    const targetColumnId = config.targetColumnId as string
    if (!targetColumnId) {
      return { success: false, error: 'Target column is required' }
    }

    const admin = getSupabaseAdmin()

    // Create a copy of the project
    const { data: newProject, error } = await admin
      .from('projects')
      .insert({
        business_id: context.card.businessId,
        title: `${context.card.title} (Copy)`,
        description: context.card.description ?? null,
        status: targetColumnId,
        priority: context.card.priority,
        client_name: context.card.clientName ?? null,
        client_email: context.card.clientEmail ?? null,
        due_date: context.card.dueDate ?? null,
      })
      .select('id')
      .single()

    if (error || !newProject) {
      return { success: false, error: error?.message ?? 'Failed to copy card' }
    }

    // Copy subtasks if requested
    if (config.copySubtasks) {
      const { data: tasks } = await admin
        .from('project_tasks')
        .select('title, description, priority, assigned_to, due_date')
        .eq('project_id', context.card.id)
        .is('parent_task_id', null)

      if (tasks && tasks.length > 0) {
        await admin.from('project_tasks').insert(
          tasks.map((task: { title: string; description: string | null; priority: string; assigned_to: string | null; due_date: string | null }) => ({
            project_id: newProject.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            assigned_to: task.assigned_to,
            due_date: task.due_date,
          }))
        )
      }
    }

    return { success: true, output: { newCardId: newProject.id } }
  },
  validate(config) {
    if (!config.targetColumnId) {
      return { valid: false, errors: ['Destination column is required'] }
    }
    return { valid: true, errors: [] }
  },
  summarize(config, boardContext) {
    const col = boardContext?.columns.find(c => c.id === config.targetColumnId)
    return `copy card to ${col?.label ?? 'a column'}`
  },
}

actionRegistry.register(handler)
export default handler
