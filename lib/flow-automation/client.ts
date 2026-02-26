import { toast } from '@/lib/toast'

/**
 * Client-side helper to fire flow automation events.
 * Calls the server-side API route which evaluates rules using the admin client.
 * Shows toasts with a 10-second countdown when flows are triggered.
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
        const toastId = `flow-${Date.now()}`
        let remaining = 10

        // Show initial countdown toast
        toast.info(
          `⚡ ${count} flow${count > 1 ? 's' : ''} triggered`,
          { id: toastId, description: `${names} — running in ${remaining}s`, duration: 12_000 }
        )

        // Update countdown every second
        const interval = setInterval(() => {
          remaining--
          if (remaining > 0) {
            toast.info(
              `⚡ ${count} flow${count > 1 ? 's' : ''} triggered`,
              { id: toastId, description: `${names} — running in ${remaining}s`, duration: 12_000 }
            )
          } else {
            clearInterval(interval)
            toast.success(
              `⚡ Flow${count > 1 ? 's' : ''} running`,
              { id: toastId, description: names, duration: 4_000 }
            )
          }
        }, 1_000)
      }
    })
    .catch(err => {
      console.error('[FlowAutomation] Failed to fire event:', err)
    })
}
