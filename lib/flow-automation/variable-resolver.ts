import type { FlowContext, VariableHint } from '@/types/flow-automation'

const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g

/**
 * Resolves {{variables}} in a template string using the flow context.
 * Unresolvable variables are left unchanged (never throws).
 */
export function resolveVariables(template: string, context: FlowContext): string {
  return template.replace(VARIABLE_REGEX, (match, path: string) => {
    const trimmed = path.trim()
    try {
      const value = resolveVariable(trimmed, context)
      return value !== undefined && value !== null ? String(value) : match
    } catch {
      return match
    }
  })
}

function resolveVariable(path: string, context: FlowContext): unknown {
  const { card, board, event, previousActionOutputs } = context

  // Card variables
  if (path === 'card.title') return card.title
  if (path === 'card.description') return card.description ?? ''
  if (path === 'card.priority') return card.priority
  if (path === 'card.column' || path === 'card.status') {
    const col = board.columns.find(c => c.id === card.status || c.label === card.status)
    return col?.label ?? card.status
  }
  if (path === 'card.due_date') return card.dueDate ?? ''
  if (path === 'card.tags') return (card.tags ?? []).join(', ')
  if (path === 'card.url') {
    const siteUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.archaflow.com'
    return `${siteUrl}/projects/${card.id}`
  }

  // Assignee variables
  if (path === 'card.assignee.name') {
    return card.assignees?.[0]?.name ?? ''
  }
  if (path === 'card.assignee.email') {
    return card.assignees?.[0]?.email ?? ''
  }

  // Creator variables
  if (path === 'card.creator.name') return card.creatorName ?? ''
  if (path === 'card.creator.email') return card.creatorEmail ?? ''

  // Custom field variables: {{card.field.FIELD_NAME}}
  if (path.startsWith('card.field.')) {
    const fieldName = path.slice('card.field.'.length)
    return card.customFields?.[fieldName] ?? ''
  }

  // Board variables
  if (path === 'board.name') return board.name

  // Trigger variables
  if (path === 'trigger.date') {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  if (path === 'trigger.user.name') {
    // The triggering user name is stored in the event payload
    return (event.payload?.userName as string) ?? ''
  }

  // Step output variables: {{step.N.output.KEY}}
  const stepMatch = path.match(/^step\.(\d+)\.output\.(.+)$/)
  if (stepMatch) {
    const stepIndex = stepMatch[1]
    const outputKey = stepMatch[2]
    const stepOutput = previousActionOutputs[`step.${stepIndex}`]
    if (stepOutput && typeof stepOutput === 'object') {
      return (stepOutput as Record<string, unknown>)[outputKey]
    }
    return undefined
  }

  return undefined
}

/**
 * Returns the list of available variables for UI hints.
 */
export function getAvailableVariables(_context?: Partial<FlowContext>): VariableHint[] {
  return [
    // Card variables
    { key: '{{card.title}}', label: 'Card title', example: 'Smith Residence', category: 'card' },
    { key: '{{card.description}}', label: 'Card description', category: 'card' },
    { key: '{{card.assignee.name}}', label: 'Assignee name', example: 'Jane Doe', category: 'card' },
    { key: '{{card.assignee.email}}', label: 'Assignee email', example: 'jane@example.com', category: 'card' },
    { key: '{{card.creator.name}}', label: 'Card creator name', category: 'card' },
    { key: '{{card.creator.email}}', label: 'Card creator email', category: 'card' },
    { key: '{{card.priority}}', label: 'Priority level', example: 'high', category: 'card' },
    { key: '{{card.column}}', label: 'Current column', example: 'Design', category: 'card' },
    { key: '{{card.tags}}', label: 'Tags (comma-separated)', example: 'urgent, vip', category: 'card' },
    { key: '{{card.due_date}}', label: 'Due date', example: '2024-03-15', category: 'card' },
    { key: '{{card.url}}', label: 'Direct link to card', category: 'card' },

    // Board variables
    { key: '{{board.name}}', label: 'Board name', category: 'board' },

    // Trigger variables
    { key: '{{trigger.date}}', label: 'Date/time rule fired', category: 'trigger' },
    { key: '{{trigger.user.name}}', label: 'User who triggered', category: 'trigger' },

    // Step output variables
    { key: '{{step.0.output.KEY}}', label: 'Output from step 1', category: 'step' },
    { key: '{{step.1.output.KEY}}', label: 'Output from step 2', category: 'step' },
  ]
}
