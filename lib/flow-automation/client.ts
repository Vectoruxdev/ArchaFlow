import { toast } from '@/lib/toast'

/**
 * Client-side helper to fire flow automation events.
 * Calls the server-side API route which evaluates rules using the admin client.
 * Shows toasts when flows are triggered and completed.
 */
export function fireFlowEvent(params: {
  type: string
  boardId: string
  cardId: string
  payload?: Record<string, unknown>
}): void {
  fetch('/api/flow-automation/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
    .then(res => res.json())
    .then((data: { ok?: boolean; matchedRules?: string[] }) => {
      if (data.matchedRules && data.matchedRules.length > 0) {
        const names = data.matchedRules.join(', ')
        const count = data.matchedRules.length
        toast.info(
          `⚡ ${count} flow${count > 1 ? 's' : ''} triggered: ${names}`,
          { description: 'Running in 10 seconds...' }
        )

        // Show completion toast after the 10s grace period + buffer
        setTimeout(() => {
          toast.success(
            `⚡ Flow${count > 1 ? 's' : ''} completed`,
            { description: names }
          )
        }, 12_000)
      }
    })
    .catch(err => {
      console.error('[FlowAutomation] Failed to fire event:', err)
    })
}
