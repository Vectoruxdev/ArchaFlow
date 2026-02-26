"use client"

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { FlowRule, FlowRuleRow } from '@/types/flow-automation'
import { flowRuleFromRow } from '@/types/flow-automation'

async function fetchFlowRules(boardId: string): Promise<FlowRule[]> {
  const { data, error } = await supabase
    .from('flow_rules')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as FlowRuleRow[]).map(flowRuleFromRow)
}

export function useFlowRules(boardId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    boardId ? ['flow-rules', boardId] : null,
    ([, id]) => fetchFlowRules(id)
  )

  async function createRule(ruleData: {
    name: string
    description?: string
    triggerType: string
    triggerConfig: Record<string, unknown>
    conditions: unknown[]
    actions: unknown[]
    workspaceId: string
  }): Promise<FlowRule | null> {
    if (!boardId) return null

    const { data: inserted, error } = await supabase
      .from('flow_rules')
      .insert({
        board_id: boardId,
        workspace_id: ruleData.workspaceId,
        name: ruleData.name,
        description: ruleData.description ?? null,
        is_active: false,
        trigger_type: ruleData.triggerType,
        trigger_config: ruleData.triggerConfig,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
      })
      .select()
      .single()

    if (error) throw error

    const newRule = flowRuleFromRow(inserted as FlowRuleRow)
    // Optimistic update
    mutate(prev => prev ? [newRule, ...prev] : [newRule], false)
    return newRule
  }

  async function updateRule(
    ruleId: string,
    updates: {
      name?: string
      description?: string
      triggerType?: string
      triggerConfig?: Record<string, unknown>
      conditions?: unknown[]
      actions?: unknown[]
      isActive?: boolean
    }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.triggerType !== undefined) updateData.trigger_type = updates.triggerType
    if (updates.triggerConfig !== undefined) updateData.trigger_config = updates.triggerConfig
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions
    if (updates.actions !== undefined) updateData.actions = updates.actions
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { error } = await supabase
      .from('flow_rules')
      .update(updateData)
      .eq('id', ruleId)

    if (error) throw error

    // Optimistic update
    mutate(
      prev =>
        prev?.map(r =>
          r.id === ruleId
            ? {
                ...r,
                ...(updates.name !== undefined && { name: updates.name }),
                ...(updates.description !== undefined && { description: updates.description }),
                ...(updates.triggerType !== undefined && {
                  trigger: { ...r.trigger, type: updates.triggerType as FlowRule['trigger']['type'] },
                }),
                ...(updates.triggerConfig !== undefined && {
                  trigger: { ...r.trigger, config: updates.triggerConfig },
                }),
                ...(updates.conditions !== undefined && { conditions: updates.conditions as FlowRule['conditions'] }),
                ...(updates.actions !== undefined && { actions: updates.actions as FlowRule['actions'] }),
                ...(updates.isActive !== undefined && { isActive: updates.isActive }),
              }
            : r
        ),
      false
    )
  }

  async function deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('flow_rules')
      .delete()
      .eq('id', ruleId)

    if (error) throw error
    mutate(prev => prev?.filter(r => r.id !== ruleId), false)
  }

  async function toggleActive(ruleId: string): Promise<void> {
    const rule = data?.find(r => r.id === ruleId)
    if (!rule) return
    await updateRule(ruleId, { isActive: !rule.isActive })
  }

  return {
    rules: data ?? [],
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleActive,
    refresh: () => mutate(),
  }
}
