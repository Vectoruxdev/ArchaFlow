import type { Node, Edge } from '@xyflow/react'
import type { FlowRule } from '@/types/flow-automation'

const COLUMN_GAP = 400
const ROW_GAP = 120
const START_X = 100
const START_Y = 80

export interface TriggerNodeData {
  ruleId: string
  ruleName: string
  isActive: boolean
  triggerType: string
  triggerConfig: Record<string, unknown>
  [key: string]: unknown
}

export interface ConditionNodeData {
  ruleId: string
  conditionId: string
  field: string
  operator: string
  value: unknown
  [key: string]: unknown
}

export interface ActionNodeData {
  ruleId: string
  actionId: string
  actionType: string
  actionConfig: Record<string, unknown>
  order: number
  continueOnFailure: boolean
  [key: string]: unknown
}

/**
 * Convert an array of FlowRules into React Flow nodes and edges.
 * Each rule becomes a vertical chain: Trigger → Conditions → Actions
 * Rules are laid out side by side horizontally.
 */
export function flowRulesToNodes(rules: FlowRule[]): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  rules.forEach((rule, colIndex) => {
    const x = START_X + colIndex * COLUMN_GAP
    let y = START_Y
    let prevNodeId: string | null = null

    // Trigger node
    const triggerNodeId = `trigger-${rule.id}`
    nodes.push({
      id: triggerNodeId,
      type: 'triggerNode',
      position: { x, y },
      data: {
        ruleId: rule.id,
        ruleName: rule.name,
        isActive: rule.isActive,
        triggerType: rule.trigger.type,
        triggerConfig: rule.trigger.config,
      } satisfies TriggerNodeData,
    })
    prevNodeId = triggerNodeId
    y += ROW_GAP

    // Condition nodes
    rule.conditions.forEach((cond) => {
      const condNodeId = `condition-${rule.id}-${cond.id}`
      nodes.push({
        id: condNodeId,
        type: 'conditionNode',
        position: { x, y },
        data: {
          ruleId: rule.id,
          conditionId: cond.id,
          field: cond.field,
          operator: cond.operator,
          value: cond.value,
        } satisfies ConditionNodeData,
      })
      if (prevNodeId) {
        edges.push({
          id: `edge-${prevNodeId}-${condNodeId}`,
          source: prevNodeId,
          target: condNodeId,
          type: 'smoothstep',
          animated: rule.isActive,
        })
      }
      prevNodeId = condNodeId
      y += ROW_GAP
    })

    // Action nodes
    rule.actions
      .sort((a, b) => a.order - b.order)
      .forEach((action) => {
        const actionNodeId = `action-${rule.id}-${action.id}`
        nodes.push({
          id: actionNodeId,
          type: 'actionNode',
          position: { x, y },
          data: {
            ruleId: rule.id,
            actionId: action.id,
            actionType: action.type,
            actionConfig: action.config,
            order: action.order,
            continueOnFailure: action.continueOnFailure,
          } satisfies ActionNodeData,
        })
        if (prevNodeId) {
          edges.push({
            id: `edge-${prevNodeId}-${actionNodeId}`,
            source: prevNodeId,
            target: actionNodeId,
            type: 'smoothstep',
            animated: rule.isActive,
          })
        }
        prevNodeId = actionNodeId
        y += ROW_GAP
      })
  })

  return { nodes, edges }
}
