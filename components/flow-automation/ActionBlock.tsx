"use client"

import { X, GripVertical, Braces } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FlowAction, ActionHandler, ActionCategory, ConfigField } from '@/types/flow-automation'
import { getAvailableVariables } from '@/lib/flow-automation/variable-resolver'

interface ActionBlockProps {
  action: FlowAction
  index: number
  handlers: Record<ActionCategory, ActionHandler[]>
  columns: Array<{ id: string; label: string }>
  teamMembers: Array<{ id: string; name: string }>
  onChange: (updated: FlowAction) => void
  onDelete: () => void
  dragHandleProps?: object
}

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  card: 'Card Actions',
  subtask: 'Subtask Actions',
  notification: 'Notifications',
  team: 'Team',
  contracts: 'Contracts',
  invoices: 'Invoices',
  ai: 'AI-Powered',
  integration: 'Integrations',
  reporting: 'Reporting',
}

export function ActionBlock({
  action,
  index,
  handlers,
  columns,
  teamMembers,
  onChange,
  onDelete,
  dragHandleProps,
}: ActionBlockProps) {
  // Find the current handler
  let currentHandler: ActionHandler | undefined
  for (const group of Object.values(handlers)) {
    const found = group.find(h => h.type === action.type)
    if (found) { currentHandler = found; break }
  }

  const isComingSoon = currentHandler?.configSchema.comingSoon

  function updateConfig(key: string, value: unknown) {
    onChange({
      ...action,
      config: { ...action.config, [key]: value },
    })
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          className="mt-2 cursor-grab text-muted-foreground hover:text-foreground"
          {...(dragHandleProps ?? {})}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {/* Action type selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium w-5 flex-shrink-0">
              {index + 1}.
            </span>
            <Select
              value={action.type}
              onValueChange={type => {
                onChange({ ...action, type: type as FlowAction['type'], config: {} })
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(handlers) as [ActionCategory, ActionHandler[]][])
                  .filter(([, group]) => group.length > 0)
                  .map(([category, group]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{CATEGORY_LABELS[category]}</SelectLabel>
                      {group.map(h => (
                        <SelectItem
                          key={h.type}
                          value={h.type}
                          disabled={h.configSchema.comingSoon}
                        >
                          {h.label}
                          {h.configSchema.comingSoon && ' (Coming soon)'}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Config fields */}
          {currentHandler && !isComingSoon && (
            <div className="space-y-2 pl-7">
              {currentHandler.configSchema.fields.map(field => (
                <ConfigFieldInput
                  key={field.key}
                  field={field}
                  value={action.config[field.key]}
                  onChange={v => updateConfig(field.key, v)}
                  columns={columns}
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          )}

          {isComingSoon && (
            <div className="pl-7">
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Coming soon — this action is not yet available
              </Badge>
            </div>
          )}

          {/* Continue on failure checkbox */}
          <div className="flex items-center gap-2 pl-7">
            <Checkbox
              id={`continue-${action.id}`}
              checked={action.continueOnFailure}
              onCheckedChange={v => onChange({ ...action, continueOnFailure: Boolean(v) })}
            />
            <label htmlFor={`continue-${action.id}`} className="text-xs text-muted-foreground">
              Continue if this action fails
            </label>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onDelete} className="flex-shrink-0 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ConfigFieldInput({
  field,
  value,
  onChange,
  columns,
  teamMembers,
}: {
  field: ConfigField
  value: unknown
  onChange: (v: unknown) => void
  columns: Array<{ id: string; label: string }>
  teamMembers: Array<{ id: string; name: string }>
}) {
  const variables = getAvailableVariables()

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <div className="relative">
            <Input
              value={String(value ?? field.defaultValue ?? '')}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
            />
            {field.supportsVariables && (
              <VariableButton variables={variables} onInsert={v => onChange(`${value ?? ''}${v}`)} />
            )}
          </div>
          {field.helpText && <p className="text-[10px] text-muted-foreground mt-0.5">{field.helpText}</p>}
        </div>
      )

    case 'textarea':
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <div className="relative">
            <Textarea
              value={String(value ?? field.defaultValue ?? '')}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              rows={3}
            />
            {field.supportsVariables && (
              <VariableButton variables={variables} onInsert={v => onChange(`${value ?? ''}${v}`)} />
            )}
          </div>
        </div>
      )

    case 'number':
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <Input
            type="number"
            value={String(value ?? field.defaultValue ?? '')}
            onChange={e => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
          />
        </div>
      )

    case 'select':
    case 'priority_picker':
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <Select value={String(value ?? field.defaultValue ?? '')} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder ?? 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'column_picker':
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <Select value={String(value ?? '')} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder ?? 'Select column...'} />
            </SelectTrigger>
            <SelectContent>
              {columns.map(col => (
                <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'user_picker':
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <Select value={String(value ?? '')} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder ?? 'Select user...'} />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(value ?? field.defaultValue)}
            onCheckedChange={v => onChange(Boolean(v))}
          />
          <label className="text-xs text-muted-foreground">{field.label}</label>
        </div>
      )

    case 'date':
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <Input
            type="date"
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )

    default:
      return (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
          <Input
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      )
  }
}

function VariableButton({
  variables,
  onInsert,
}: {
  variables: Array<{ key: string; label: string; category: string }>
  onInsert: (variable: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          title="Insert variable"
        >
          <Braces className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Insert variable</p>
        {variables.map(v => (
          <button
            key={v.key}
            onClick={() => onInsert(v.key)}
            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent flex items-center justify-between"
          >
            <span className="font-mono text-[11px]">{v.key}</span>
            <span className="text-muted-foreground text-[10px] ml-2">{v.label}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
