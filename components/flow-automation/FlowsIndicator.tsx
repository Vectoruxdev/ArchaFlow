"use client"

import { useState } from 'react'
import { Zap, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useFlowRules } from '@/lib/hooks/use-flow-rules'

interface FlowsIndicatorProps {
  boardId: string
  onManageFlows: () => void
}

export function FlowsIndicator({ boardId, onManageFlows }: FlowsIndicatorProps) {
  const { rules } = useFlowRules(boardId)
  const activeRules = rules.filter(r => r.isActive)
  const [open, setOpen] = useState(false)

  const statusDot = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'partial': return 'bg-amber-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs">Flows</span>
          {activeRules.length > 0 && (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 px-1 text-[10px] bg-amber-100 text-amber-700"
            >
              {activeRules.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end">
        <div className="space-y-1">
          {activeRules.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No active flows
            </div>
          ) : (
            activeRules.slice(0, 5).map(rule => (
              <div
                key={rule.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-sm"
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(rule.lastRunStatus)}`} />
                <span className="truncate flex-1">{rule.name}</span>
                {rule.runCount > 0 && (
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {rule.runCount}x
                  </span>
                )}
              </div>
            ))
          )}
          {activeRules.length > 5 && (
            <p className="text-[10px] text-muted-foreground px-2">
              +{activeRules.length - 5} more
            </p>
          )}
        </div>
        <button
          onClick={() => { setOpen(false); onManageFlows() }}
          className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded transition-colors border-t"
        >
          Manage flows
          <ChevronRight className="h-3 w-3" />
        </button>
      </PopoverContent>
    </Popover>
  )
}
