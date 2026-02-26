import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateRulesForEvent, findMatchingRules } from '@/lib/flow-automation/trigger-engine'
import type { KanbanEvent } from '@/types/flow-automation'

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const event: KanbanEvent = {
      type: body.type,
      boardId: body.boardId,
      cardId: body.cardId,
      triggeredBy: user.id,
      payload: body.payload ?? {},
    }

    if (!event.type || !event.boardId || !event.cardId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, boardId, cardId' },
        { status: 400 }
      )
    }

    // Quick match check — returns immediately with matched rule names
    const matchedRules = await findMatchingRules(event)

    // Fire and forget — execute rules in background with grace period
    if (matchedRules.length > 0) {
      evaluateRulesForEvent(event).catch(err => {
        console.error('[FlowAPI] Error evaluating rules:', err)
      })
    }

    return NextResponse.json({ ok: true, matchedRules })
  } catch (err) {
    console.error('[FlowAPI] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
