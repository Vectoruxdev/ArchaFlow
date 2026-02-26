"use client"

import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  type OnConnect,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TriggerNode } from './nodes/TriggerNode'
import { ConditionNode } from './nodes/ConditionNode'
import { ActionNode } from './nodes/ActionNode'
import { flowRulesToNodes } from './utils/flow-to-nodes'
import { nodesToFlowRule } from './utils/nodes-to-flow'
import type { FlowRule } from '@/types/flow-automation'

const nodeTypes = {
  triggerNode: TriggerNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
}

interface FlowCanvasProps {
  rules: FlowRule[]
  selectedRuleId?: string
  onSaveRule?: (ruleId: string, updates: Partial<FlowRule>) => void
  onDeleteNode?: (nodeId: string, ruleId: string) => void
}

export function FlowCanvas({ rules, selectedRuleId, onSaveRule }: FlowCanvasProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => flowRulesToNodes(rules),
    [rules]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { fitView, setCenter } = useReactFlow()

  // Sync when rules change externally
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = flowRulesToNodes(rules)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [rules, setNodes, setEdges])

  // Focus on selected rule
  useEffect(() => {
    if (!selectedRuleId) return
    const triggerNode = nodes.find(n => n.id === `trigger-${selectedRuleId}`)
    if (triggerNode) {
      setCenter(triggerNode.position.x + 130, triggerNode.position.y + 60, {
        zoom: 1,
        duration: 500,
      })
    }
  }, [selectedRuleId, nodes, setCenter])

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // Validate connection: only allow valid flow direction
      const sourceNode = nodes.find(n => n.id === connection.source)
      const targetNode = nodes.find(n => n.id === connection.target)
      if (!sourceNode || !targetNode) return

      const sourceType = sourceNode.type
      const targetType = targetNode.type

      // Allowed: trigger→condition, trigger→action, condition→action, action→action
      const allowed =
        (sourceType === 'triggerNode' && (targetType === 'conditionNode' || targetType === 'actionNode')) ||
        (sourceType === 'conditionNode' && targetType === 'actionNode') ||
        (sourceType === 'actionNode' && targetType === 'actionNode')

      if (!allowed) return

      // Must be same rule
      const sourceRuleId = (sourceNode.data as { ruleId: string }).ruleId
      const targetRuleId = (targetNode.data as { ruleId: string }).ruleId
      if (sourceRuleId !== targetRuleId) return

      setEdges(eds => addEdge({ ...connection, type: 'smoothstep', animated: true }, eds))
    },
    [nodes, setEdges]
  )

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!onSaveRule) return
      const ruleId = (node.data as { ruleId: string }).ruleId
      const updates = nodesToFlowRule(nodes, edges, ruleId)
      if (updates.trigger) {
        onSaveRule(ruleId, updates)
      }
    },
    [nodes, edges, onSaveRule]
  )

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep' as const,
      style: { strokeWidth: 2 },
    }),
    []
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        deleteKeyCode="Delete"
        className="bg-[--af-bg-canvas]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
        <Controls className="!bg-background !border-border !shadow-md [&>button]:!bg-background [&>button]:!border-border [&>button]:hover:!bg-muted [&>button]:!text-foreground" />
        <MiniMap
          className="!bg-background !border-border"
          nodeColor={(node) => {
            if (node.type === 'triggerNode') return '#f59e0b'
            if (node.type === 'conditionNode') return '#3b82f6'
            if (node.type === 'actionNode') return '#a855f7'
            return '#6b7280'
          }}
        />
      </ReactFlow>
    </div>
  )
}
