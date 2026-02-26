"use client"

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TriggerNodeData } from '../utils/flow-to-nodes'
import { triggerRegistry } from '@/lib/flow-automation/trigger-registry'
import '@/lib/flow-automation/triggers/index'

function TriggerNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as TriggerNodeData
  const handler = triggerRegistry.get(d.triggerType as Parameters<typeof triggerRegistry.get>[0])

  return (
    <div
      className={`w-[260px] rounded-xl border-2 bg-background shadow-md transition-colors ${
        selected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-300/50'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-t-[10px] border-b border-amber-200/50">
        <Zap className="h-3.5 w-3.5 text-amber-500" />
        <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 hover:bg-amber-100">
          TRIGGER
        </Badge>
        <span className={`ml-auto w-2 h-2 rounded-full ${d.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{d.ruleName}</p>
        <p className="text-sm font-medium">
          {handler?.label ?? d.triggerType}
        </p>
        {handler && (
          <p className="text-xs text-muted-foreground mt-1">
            {handler.summarize(d.triggerConfig, undefined as never)}
          </p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-background"
      />
    </div>
  )
}

export const TriggerNode = memo(TriggerNodeComponent)
