import type { ActionHandler, ActionType, ActionCategory } from '@/types/flow-automation'

class ActionRegistry {
  private handlers = new Map<ActionType, ActionHandler>()

  register(handler: ActionHandler): void {
    if (this.handlers.has(handler.type)) {
      console.warn(`[ActionRegistry] Overwriting existing handler for "${handler.type}"`)
    }
    this.handlers.set(handler.type, handler)
  }

  get(type: ActionType): ActionHandler | undefined {
    return this.handlers.get(type)
  }

  getAll(): ActionHandler[] {
    return Array.from(this.handlers.values())
  }

  getByCategory(): Record<ActionCategory, ActionHandler[]> {
    const grouped: Record<ActionCategory, ActionHandler[]> = {
      card: [],
      subtask: [],
      notification: [],
      team: [],
      contracts: [],
      invoices: [],
      ai: [],
      integration: [],
      reporting: [],
    }

    for (const handler of this.handlers.values()) {
      if (!grouped[handler.category]) {
        grouped[handler.category] = []
      }
      grouped[handler.category].push(handler)
    }

    return grouped
  }

  has(type: ActionType): boolean {
    return this.handlers.has(type)
  }

  get size(): number {
    return this.handlers.size
  }
}

export const actionRegistry = new ActionRegistry()
