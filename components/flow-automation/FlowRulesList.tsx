"use client"

import { useState } from 'react'
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  History,
  LayoutList,
  Network,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import { useAuth } from '@/lib/auth/auth-context'
import { useFlowRules } from '@/lib/hooks/use-flow-rules'
import { RecipePicker } from './RecipePicker'
import { FlowRuleEditor } from './FlowRuleEditor'
import { RunHistoryDrawer } from './RunHistoryDrawer'
import { VisualFlowBuilder } from './visual-builder/VisualFlowBuilder'
import type { FlowRule, FlowRecipeTemplate } from '@/types/flow-automation'

interface FlowRulesListProps {
  boardId: string
  onViewModeChange?: (mode: 'list' | 'visual') => void
}

export function FlowRulesList({ boardId, onViewModeChange }: FlowRulesListProps) {
  const { currentWorkspace } = useAuth()
  const workspaceId = currentWorkspace?.id ?? boardId
  const { rules, isLoading, createRule, updateRule, deleteRule, toggleActive } = useFlowRules(boardId)

  const [viewMode, setViewMode] = useState<'list' | 'visual'>('list')
  const [showRecipePicker, setShowRecipePicker] = useState(false)

  function handleViewModeChange(mode: 'list' | 'visual') {
    setViewMode(mode)
    onViewModeChange?.(mode)
  }
  const [editorState, setEditorState] = useState<{
    open: boolean
    initialRule?: Partial<FlowRule>
    editingId?: string
  }>({ open: false })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; ruleId: string; ruleName: string }>({
    open: false,
    ruleId: '',
    ruleName: '',
  })
  const [historyDrawer, setHistoryDrawer] = useState<{
    open: boolean
    ruleId: string
    ruleName: string
  }>({ open: false, ruleId: '', ruleName: '' })

  function handleSelectTemplate(template: FlowRecipeTemplate) {
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
  }

  function handleBuildFromScratch() {
    setShowRecipePicker(false)
    setEditorState({ open: true })
  }

  function handleEditRule(rule: FlowRule) {
    setEditorState({
      open: true,
      initialRule: rule,
      editingId: rule.id,
    })
  }

  async function handleSaveRule(data: {
    name: string
    description?: string
    isActive: boolean
    triggerType: string
    triggerConfig: Record<string, unknown>
    conditions: unknown[]
    actions: unknown[]
  }) {
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
        await createRule({
          name: data.name,
          description: data.description,
          triggerType: data.triggerType,
          triggerConfig: data.triggerConfig,
          conditions: data.conditions,
          actions: data.actions,
          workspaceId,
        })
        toast.success('Flow rule created')
      }
      setEditorState({ open: false })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save rule')
    }
  }

  async function handleDeleteRule() {
    try {
      await deleteRule(deleteConfirm.ruleId)
      toast.success('Flow rule deleted')
      setDeleteConfirm({ open: false, ruleId: '', ruleName: '' })
    } catch (err) {
      toast.error('Failed to delete rule')
    }
  }

  async function handleToggleActive(ruleId: string) {
    try {
      await toggleActive(ruleId)
    } catch {
      toast.error('Failed to toggle rule')
    }
  }

  function formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return 'Never'
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

  const statusDot = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'partial': return 'bg-amber-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  const activeRulesCount = rules.filter(r => r.isActive).length

  if (viewMode === 'visual') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Flow Automation</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-0.5">
              <button
                onClick={() => handleViewModeChange('list')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors text-muted-foreground hover:text-foreground"
              >
                <LayoutList className="h-3.5 w-3.5" />
                List
              </button>
              <button
                onClick={() => handleViewModeChange('visual')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors bg-primary text-primary-foreground"
              >
                <Network className="h-3.5 w-3.5" />
                Visual
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <VisualFlowBuilder boardId={boardId} />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Flow Automation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automate actions when things happen on your board
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-0.5">
            <button
              onClick={() => handleViewModeChange('list')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors bg-primary text-primary-foreground"
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => handleViewModeChange('visual')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors text-muted-foreground hover:text-foreground"
            >
              <Network className="h-3.5 w-3.5" />
              Visual
            </button>
          </div>
          <Button onClick={() => setShowRecipePicker(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Flow
          </Button>
        </div>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-medium mb-1">No flows yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Flows automatically trigger actions when things happen on your board. Create your first flow to get started.
          </p>
          <Button onClick={() => setShowRecipePicker(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create your first flow
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              {/* Active indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />

              {/* Rule info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{rule.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                    {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {rule.lastRunAt && (
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(rule.lastRunStatus)}`} />
                      {formatRelativeTime(rule.lastRunAt)}
                    </span>
                  )}
                  {rule.runCount > 0 && (
                    <button
                      onClick={() => setHistoryDrawer({
                        open: true,
                        ruleId: rule.id,
                        ruleName: rule.name,
                      })}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <History className="h-3 w-3" />
                      {rule.runCount} run{rule.runCount !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={() => handleToggleActive(rule.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditRule(rule)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteConfirm({ open: true, ruleId: rule.id, ruleName: rule.name })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Run History Drawer */}
      <RunHistoryDrawer
        ruleId={historyDrawer.ruleId}
        ruleName={historyDrawer.ruleName}
        open={historyDrawer.open}
        onClose={() => setHistoryDrawer({ open: false, ruleId: '', ruleName: '' })}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={v => !v && setDeleteConfirm({ open: false, ruleId: '', ruleName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flow Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm.ruleName}&quot;? This action cannot be undone.
              All run history for this rule will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, ruleId: '', ruleName: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
