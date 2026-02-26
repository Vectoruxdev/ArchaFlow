import type { Node, Edge } from '@xyflow/react'
import type { FlowRule, FlowTrigger, FlowCondition, FlowAction, TriggerType, ActionType } from '@/types/flow-automation'
import type { TriggerNodeData, ConditionNodeData, ActionNodeData } from './flow-to-nodes'

/**
 * Reconstruct a FlowRule from a chain of nodes/edges belonging to one rule.
 * Traverses the edge graph starting from the trigger node to determine order.
 */
export function nodesToFlowRule(
  allNodes: Node[],
  allEdges: Edge[],
  ruleId: string,
  existingRule?: FlowRule,
): Partial<FlowRule> {
  // Filter nodes belonging to this rule
  const ruleNodes = allNodes.filter(n => (n.data as { ruleId?: string }).ruleId === ruleId)
  const ruleEdges = allEdges.filter(e => {
    const sourceNode = allNodes.find(n => n.id === e.source)
    const targetNode = allNodes.find(n => n.id === e.target)
    return (
      (sourceNode?.data as { ruleId?: string })?.ruleId === ruleId &&
      (targetNode?.data as { ruleId?: string })?.ruleId === ruleId
    )
  })

  // Find trigger node
  const triggerNode = ruleNodes.find(n => n.type === 'triggerNode')
  if (!triggerNode) return {}

  const triggerData = triggerNode.data as TriggerNodeData

  // Build adjacency list from edges
  const adjacency = new Map<string, string>()
  for (const edge of ruleEdges) {
    adjacency.set(edge.source, edge.target)
  }

  // Walk the chain from trigger node
  const conditions: FlowCondition[] = []
  const actions: FlowAction[] = []
  let currentId: string | undefined = adjacency.get(triggerNode.id)
  let actionOrder = 0

  while (currentId) {
    const node = ruleNodes.find(n => n.id === currentId)
    if (!node) break

    if (node.type === 'conditionNode') {
      const data = node.data as ConditionNodeData
      conditions.push({
        id: data.conditionId,
        field: data.field,
        operator: data.operator as FlowCondition['operator'],
        value: data.value,
      })
    } else if (node.type === 'actionNode') {
      const data = node.data as ActionNodeData
      actions.push({
        id: data.actionId,
        type: data.actionType as ActionType,
        config: data.actionConfig,
        order: actionOrder++,
        continueOnFailure: data.continueOnFailure,
      })
    }

    currentId = adjacency.get(currentId)
  }

  const trigger: FlowTrigger = {
    type: triggerData.triggerType as TriggerType,
    config: triggerData.triggerConfig,
  }

  return {
    id: ruleId,
    name: triggerData.ruleName,
    isActive: triggerData.isActive,
    trigger,
    conditions,
    actions,
    ...(existingRule && {
      boardId: existingRule.boardId,
      workspaceId: existingRule.workspaceId,
    }),
  }
}
