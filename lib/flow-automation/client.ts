/**
 * Client-side helper to fire flow automation events.
 * Calls the server-side API route which evaluates rules using the admin client.
 * All calls are fire-and-forget (non-blocking).
 */
export function fireFlowEvent(params: {
  type: string
  boardId: string
  cardId: string
  payload?: Record<string, unknown>
}): void {
  // Fire and forget — never block the UI
  fetch('/api/flow-automation/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(err => {
    console.error('[FlowAutomation] Failed to fire event:', err)
  })
}
