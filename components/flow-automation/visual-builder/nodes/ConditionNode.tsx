"use client"

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ConditionNodeData } from '../utils/flow-to-nodes'

const OPERATOR_LABELS: Record<string, string> = {
  equals: '=',
  not_equals: '≠',
  contains: 'contains',
  not_contains: 'not contains',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  is_one_of: 'is one of',
  greater_than: '>',
  less_than: '<',
  is_set: 'is set',
  is_not_set: 'is not set',
}

function ConditionNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as ConditionNodeData

  return (
    <div
      className={`w-[260px] rounded-xl border-2 bg-background shadow-md transition-colors ${
        selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-300/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background"
      />
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-t-[10px] border-b border-blue-200/50">
        <Filter className="h-3.5 w-3.5 text-blue-500" />
        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 hover:bg-blue-100">
          CONDITION
        </Badge>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium">
          {d.field} {OPERATOR_LABELS[d.operator] ?? d.operator} {String(d.value ?? '')}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-background"
      />
    </div>
  )
}

export const ConditionNode = memo(ConditionNodeComponent)
