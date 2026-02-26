import type { TriggerHandler, TriggerType } from '@/types/flow-automation'

class TriggerRegistry {
  private handlers = new Map<TriggerType, TriggerHandler>()

  register(handler: TriggerHandler): void {
    if (this.handlers.has(handler.type)) {
      console.warn(`[TriggerRegistry] Overwriting existing handler for "${handler.type}"`)
    }
    this.handlers.set(handler.type, handler)
  }

  get(type: TriggerType): TriggerHandler | undefined {
    return this.handlers.get(type)
  }

  getAll(): TriggerHandler[] {
    return Array.from(this.handlers.values())
  }

  has(type: TriggerType): boolean {
    return this.handlers.has(type)
  }

  get size(): number {
    return this.handlers.size
  }
}

export const triggerRegistry = new TriggerRegistry()
