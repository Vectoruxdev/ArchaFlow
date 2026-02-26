"use client"

import { useState, useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, XCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import type { FlowRunLog } from '@/types/flow-automation'

interface RunHistoryDrawerProps {
  ruleId: string
  ruleName: string
  open: boolean
  onClose: () => void
}

interface RunLogRow {
  id: string
  rule_id: string
  board_id: string
  card_id: string | null
  triggered_by: string | null
  triggered_at: string
  status: string
  actions_total: number
  actions_succeeded: number
  actions_failed: number
  action_results: Array<{ success: boolean; error?: string; details?: string }>
  error_message: string | null
  duration_ms: number
}

export function RunHistoryDrawer({ ruleId, ruleName, open, onClose }: RunHistoryDrawerProps) {
  const [runs, setRuns] = useState<RunLogRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !ruleId) return

    async function fetchRuns() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('flow_run_log')
        .select('*')
        .eq('rule_id', ruleId)
        .order('triggered_at', { ascending: false })
        .limit(25)

      if (!error && data) {
        setRuns(data as RunLogRow[])
      }
      setIsLoading(false)
    }

    fetchRuns()
  }, [open, ruleId])

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">Success</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">Partial</Badge>
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-700 text-[10px]">Failed</Badge>
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>
    }
  }

  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Run History: {ruleName}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))
          ) : runs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No runs yet</p>
              <p className="text-xs">This rule hasn&apos;t been triggered</p>
            </div>
          ) : (
            runs.map(run => (
              <div key={run.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  {statusIcon(run.status)}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      {statusBadge(run.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(run.triggered_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {run.actions_succeeded}/{run.actions_total} actions succeeded
                      {run.duration_ms ? ` · ${run.duration_ms}ms` : ''}
                    </p>
                  </div>
                  {expandedRunId === run.id
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  }
                </button>

                {expandedRunId === run.id && run.action_results && (
                  <div className="border-t px-3 py-2 bg-muted/20 space-y-1">
                    {run.action_results.map((result, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        {result.success
                          ? <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          : <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                        }
                        <span className={result.success ? 'text-muted-foreground' : 'text-red-600'}>
                          Step {i + 1}
                          {result.error && `: ${result.error}`}
                          {result.details && ` — ${result.details}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
