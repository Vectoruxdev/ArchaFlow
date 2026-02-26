"use client"

import { useState, useMemo, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ConditionRow } from './ConditionRow'
import { ActionBlock } from './ActionBlock'
import { useFlowBoardContext } from '@/lib/hooks/use-flow-board-context'
import { triggerRegistry } from '@/lib/flow-automation/trigger-registry'
import { actionRegistry } from '@/lib/flow-automation/action-registry'
import type {
  FlowRule,
  FlowAction,
  FlowCondition,
  TriggerType,
  ActionType,
  ActionCategory,
  ActionHandler,
  TriggerHandler,
} from '@/types/flow-automation'

// Ensure registries are populated
import '@/lib/flow-automation/triggers/index'
import '@/lib/flow-automation/actions/index'

interface FlowRuleEditorProps {
  boardId: string
  workspaceId: string
  open: boolean
  initialRule?: Partial<FlowRule>
  onSave: (rule: {
    name: string
    description?: string
    isActive: boolean
    triggerType: string
    triggerConfig: Record<string, unknown>
    conditions: FlowCondition[]
    actions: FlowAction[]
  }) => void
  onCancel: () => void
}

export function FlowRuleEditor({
  boardId,
  workspaceId,
  open,
  initialRule,
  onSave,
  onCancel,
}: FlowRuleEditorProps) {
  const { columns, teamMembers } = useFlowBoardContext(boardId)

  // Form state
  const [name, setName] = useState(initialRule?.name ?? '')
  const [description, setDescription] = useState(initialRule?.description ?? '')
  const [isActive, setIsActive] = useState(initialRule?.isActive ?? false)
  const [triggerType, setTriggerType] = useState<string>(initialRule?.trigger?.type ?? '')
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(
    initialRule?.trigger?.config ?? {}
  )
  const [conditions, setConditions] = useState<FlowCondition[]>(initialRule?.conditions ?? [])
  const [actions, setActions] = useState<FlowAction[]>(initialRule?.actions ?? [])
  const [showConditions, setShowConditions] = useState((initialRule?.conditions?.length ?? 0) > 0)

  // Reset form when initialRule changes
  useEffect(() => {
    if (open) {
      setName(initialRule?.name ?? '')
      setDescription(initialRule?.description ?? '')
      setIsActive(initialRule?.isActive ?? false)
      setTriggerType(initialRule?.trigger?.type ?? '')
      setTriggerConfig(initialRule?.trigger?.config ?? {})
      setConditions(initialRule?.conditions ?? [])
      setActions(initialRule?.actions ?? [])
      setShowConditions((initialRule?.conditions?.length ?? 0) > 0)
    }
  }, [open, initialRule])

  // Get registries
  const allTriggers = useMemo(() => triggerRegistry.getAll(), [])
  const actionsByCategory = useMemo(() => actionRegistry.getByCategory(), [])
  const currentTrigger = useMemo(
    () => (triggerType ? triggerRegistry.get(triggerType as TriggerType) : undefined),
    [triggerType]
  )

  // Validation
  const isValid = useMemo(() => {
    if (!name.trim()) return false
    if (!triggerType) return false
    if (currentTrigger) {
      const validation = currentTrigger.validate(triggerConfig)
      if (!validation.valid) return false
    }
    if (actions.length === 0) return false
    return true
  }, [name, triggerType, triggerConfig, currentTrigger, actions])

  // Build preview sentence
  const previewSentence = useMemo(() => {
    const parts: string[] = []
    const boardContext = {
      id: boardId,
      name: 'Board',
      columns: columns.map(c => ({ ...c, colorKey: '' })),
      workspaceId,
    }

    if (currentTrigger) {
      parts.push(`When ${currentTrigger.summarize(triggerConfig, boardContext)}`)
    }

    if (conditions.length > 0) {
      parts.push(`and conditions are met`)
    }

    const actionSummaries = actions
      .map(a => {
        let handler: ActionHandler | undefined
        for (const group of Object.values(actionsByCategory)) {
          const found = group.find(h => h.type === a.type)
          if (found) { handler = found; break }
        }
        return handler?.summarize(a.config, boardContext) ?? a.type
      })
      .filter(Boolean)

    if (actionSummaries.length > 0) {
      parts.push(`do: ${actionSummaries.join(', then ')}`)
    }

    return parts.join(', ')
  }, [currentTrigger, triggerType, triggerConfig, conditions, actions, actionsByCategory, boardId, columns, workspaceId])

  function addCondition() {
    const newCondition: FlowCondition = {
      id: crypto.randomUUID(),
      field: 'priority',
      operator: 'equals',
      value: '',
    }
    setConditions([...conditions, newCondition])
    setShowConditions(true)
  }

  function addAction() {
    const newAction: FlowAction = {
      id: crypto.randomUUID(),
      type: 'move_card' as ActionType,
      config: {},
      order: actions.length,
      continueOnFailure: true,
    }
    setActions([...actions, newAction])
  }

  function handleActionDragEnd(result: DropResult) {
    if (!result.destination) return
    const items = Array.from(actions)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setActions(items.map((a, i) => ({ ...a, order: i })))
  }

  function handleSave() {
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      isActive,
      triggerType,
      triggerConfig,
      conditions,
      actions,
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Zap className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Rule name..."
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-muted-foreground">
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Section 1: Trigger */}
          <section>
            <h3 className="text-sm font-semibold mb-3">When this happens:</h3>
            <Select value={triggerType} onValueChange={type => { setTriggerType(type); setTriggerConfig({}) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a trigger..." />
              </SelectTrigger>
              <SelectContent>
                {allTriggers.map(t => (
                  <SelectItem key={t.type} value={t.type}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Trigger config fields */}
            {currentTrigger && currentTrigger.configSchema.fields.length > 0 && (
              <div className="mt-3 space-y-2 pl-4 border-l-2 border-amber-200">
                {currentTrigger.configSchema.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                    {field.type === 'column_picker' ? (
                      <Select
                        value={String(triggerConfig[field.key] ?? '')}
                        onValueChange={v => setTriggerConfig({ ...triggerConfig, [field.key]: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder ?? 'Select column...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(col => (
                            <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'user_picker' ? (
                      <Select
                        value={String(triggerConfig[field.key] ?? '')}
                        onValueChange={v => setTriggerConfig({ ...triggerConfig, [field.key]: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder ?? 'Select user...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'number' ? (
                      <Input
                        type="number"
                        value={String(triggerConfig[field.key] ?? field.defaultValue ?? '')}
                        onChange={e => setTriggerConfig({ ...triggerConfig, [field.key]: Number(e.target.value) })}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <Input
                        value={String(triggerConfig[field.key] ?? '')}
                        onChange={e => setTriggerConfig({ ...triggerConfig, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.helpText && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: Conditions */}
          <section>
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="flex items-center gap-2 text-sm font-semibold mb-3 hover:text-primary transition-colors"
            >
              {showConditions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              But only if:
              {conditions.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </button>

            {showConditions && (
              <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                {conditions.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    No conditions — rule always runs when triggered
                  </p>
                )}
                {conditions.map((cond, i) => (
                  <div key={cond.id}>
                    {i > 0 && (
                      <div className="text-[10px] text-muted-foreground font-medium uppercase my-1 ml-1">
                        AND
                      </div>
                    )}
                    <ConditionRow
                      condition={cond}
                      columns={columns}
                      onChange={updated => {
                        setConditions(conditions.map(c => c.id === cond.id ? updated : c))
                      }}
                      onDelete={() => {
                        setConditions(conditions.filter(c => c.id !== cond.id))
                      }}
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCondition} className="mt-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Condition
                </Button>
              </div>
            )}
          </section>

          {/* Section 3: Actions */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Then do this:</h3>
            <DragDropContext onDragEnd={handleActionDragEnd}>
              <Droppable droppableId="actions">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {actions.map((action, i) => (
                      <Draggable key={action.id} draggableId={action.id} index={i}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <ActionBlock
                              action={action}
                              index={i}
                              handlers={actionsByCategory}
                              columns={columns}
                              teamMembers={teamMembers}
                              dragHandleProps={provided.dragHandleProps as object | undefined}
                              onChange={updated => {
                                setActions(actions.map(a => a.id === action.id ? updated : a))
                              }}
                              onDelete={() => {
                                setActions(actions.filter(a => a.id !== action.id))
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Button variant="outline" size="sm" onClick={addAction} className="mt-3">
              <Plus className="h-3 w-3 mr-1" />
              Add Action
            </Button>
          </section>

          {/* Preview sentence */}
          {previewSentence && (
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-xs text-muted-foreground font-medium mb-1">Preview:</p>
              <p className="text-sm">{previewSentence}</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {initialRule?.id ? 'Save Changes' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
