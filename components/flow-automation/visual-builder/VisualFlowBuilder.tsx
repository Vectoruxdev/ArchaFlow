"use client"

import { useState, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowBuilderSidebar } from './FlowBuilderSidebar'
import { FlowCanvas } from './FlowCanvas'
import { useFlowRules } from '@/lib/hooks/use-flow-rules'
import { useAuth } from '@/lib/auth/auth-context'
import { RecipePicker } from '../RecipePicker'
import { FlowRuleEditor } from '../FlowRuleEditor'
import { toast } from '@/lib/toast'
import type { FlowRule, FlowRecipeTemplate } from '@/types/flow-automation'

interface VisualFlowBuilderProps {
  boardId: string
}

export function VisualFlowBuilder({ boardId }: VisualFlowBuilderProps) {
  const { currentWorkspace } = useAuth()
  const workspaceId = currentWorkspace?.id ?? boardId
  const { rules, createRule, updateRule, toggleActive } = useFlowRules(boardId)

  const [selectedRuleId, setSelectedRuleId] = useState<string | undefined>()
  const [showRecipePicker, setShowRecipePicker] = useState(false)
  const [editorState, setEditorState] = useState<{
    open: boolean
    initialRule?: Partial<FlowRule>
    editingId?: string
  }>({ open: false })

  const handleNewFlow = useCallback(() => {
    setShowRecipePicker(true)
  }, [])

  const handleSelectTemplate = useCallback((template: FlowRecipeTemplate) => {
    setShowRecipePicker(false)
    setEditorState({
      open: true,
      initialRule: {
        name: template.name,
        description: template.description,
        trigger: {
          type: template.triggerType,
          config: template.triggerConfig,
        },
        conditions: template.conditions,
        actions: template.actions,
        isActive: false,
      },
    })
  }, [])

  const handleBuildFromScratch = useCallback(() => {
    setShowRecipePicker(false)
    setEditorState({ open: true })
  }, [])

  const handleSaveRule = useCallback(async (data: {
    name: string
    description?: string
    isActive: boolean
    triggerType: string
    triggerConfig: Record<string, unknown>
    conditions: unknown[]
    actions: unknown[]
  }) => {
    try {
      if (editorState.editingId) {
        await updateRule(editorState.editingId, {
          name: data.name,
          description: data.description,
          triggerType: data.triggerType,
          triggerConfig: data.triggerConfig,
          conditions: data.conditions,
          actions: data.actions,
          isActive: data.isActive,
        })
        toast.success('Flow rule updated')
      } else {
        const newRule = await createRule({
          name: data.name,
          description: data.description,
          triggerType: data.triggerType,
          triggerConfig: data.triggerConfig,
          conditions: data.conditions,
          actions: data.actions,
          workspaceId,
        })
        if (newRule) setSelectedRuleId(newRule.id)
        toast.success('Flow rule created')
      }
      setEditorState({ open: false })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save rule')
    }
  }, [editorState.editingId, createRule, updateRule, workspaceId])

  const handleCanvasSave = useCallback(async (ruleId: string, updates: Partial<FlowRule>) => {
    try {
      await updateRule(ruleId, {
        name: updates.name,
        triggerType: updates.trigger?.type,
        triggerConfig: updates.trigger?.config,
        conditions: updates.conditions,
        actions: updates.actions,
        isActive: updates.isActive,
      })
    } catch {
      toast.error('Failed to save flow changes')
    }
  }, [updateRule])

  const handleRenameRule = useCallback(async (ruleId: string, name: string) => {
    try {
      await updateRule(ruleId, { name })
      toast.success('Flow renamed')
    } catch {
      toast.error('Failed to rename flow')
    }
  }, [updateRule])

  const handleToggleActive = useCallback(async (ruleId: string) => {
    try {
      await toggleActive(ruleId)
    } catch {
      toast.error('Failed to toggle flow')
    }
  }, [toggleActive])

  return (
    <div className="flex h-full w-full">
      <FlowBuilderSidebar
        rules={rules}
        selectedRuleId={selectedRuleId}
        onSelectRule={setSelectedRuleId}
        onToggleActive={handleToggleActive}
        onNewFlow={handleNewFlow}
        onRenameRule={handleRenameRule}
      />

      <div className="flex-1 h-full">
        {rules.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Create your first flow to see it on the canvas</p>
              <button
                onClick={handleNewFlow}
                className="text-sm text-primary hover:underline"
              >
                + New Flow
              </button>
            </div>
          </div>
        ) : (
          <ReactFlowProvider>
            <FlowCanvas
              rules={rules}
              selectedRuleId={selectedRuleId}
              onSaveRule={handleCanvasSave}
            />
          </ReactFlowProvider>
        )}
      </div>

      {/* Recipe Picker */}
      <RecipePicker
        boardId={boardId}
        open={showRecipePicker}
        onSelectTemplate={handleSelectTemplate}
        onBuildFromScratch={handleBuildFromScratch}
        onClose={() => setShowRecipePicker(false)}
      />

      {/* Rule Editor */}
      <FlowRuleEditor
        boardId={boardId}
        workspaceId={workspaceId}
        open={editorState.open}
        initialRule={editorState.initialRule}
        onSave={handleSaveRule}
        onCancel={() => setEditorState({ open: false })}
      />
    </div>
  )
}
