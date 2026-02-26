"use client"

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ActionNodeData } from '../utils/flow-to-nodes'
import { actionRegistry } from '@/lib/flow-automation/action-registry'
import '@/lib/flow-automation/actions/index'

function ActionNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as ActionNodeData
  const handler = actionRegistry.get(d.actionType as Parameters<typeof actionRegistry.get>[0])

  return (
    <div
      className={`w-[260px] rounded-xl border-2 bg-background shadow-md transition-colors ${
        selected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-purple-300/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-background"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-t-[10px] border-b border-purple-200/50">
        <Play className="h-3.5 w-3.5 text-purple-500" />
        <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0 hover:bg-purple-100">
          ACTION
        </Badge>
        {d.continueOnFailure && (
          <span className="text-[9px] text-muted-foreground ml-auto">skip on fail</span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium">
          {handler?.label ?? d.actionType}
        </p>
        {handler && (
          <p className="text-xs text-muted-foreground mt-1">
            {handler.summarize(d.actionConfig, undefined as never)}
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-background"
      />
    </div>
  )
}

export const ActionNode = memo(ActionNodeComponent)
