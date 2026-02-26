"use client"

import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { FlowCondition, ConditionOperator } from '@/types/flow-automation'

interface ConditionRowProps {
  condition: FlowCondition
  onChange: (updated: FlowCondition) => void
  onDelete: () => void
  columns: Array<{ id: string; label: string }>
}

const FIELDS = [
  { value: 'title', label: 'Card title' },
  { value: 'description', label: 'Description' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Column' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'due_date', label: 'Due date' },
  { value: 'tags', label: 'Tags' },
  { value: 'creator', label: 'Creator' },
]

const OPERATORS: Record<string, Array<{ value: ConditionOperator; label: string }>> = {
  title: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'equals' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  description: [
    { value: 'contains', label: 'contains' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  priority: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
  status: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
  assignee: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  due_date: [
    { value: 'is_set', label: 'is set' },
    { value: 'is_not_set', label: 'is not set' },
  ],
  tags: [
    { value: 'contains', label: 'has tag' },
    { value: 'not_contains', label: 'does not have tag' },
    { value: 'is_empty', label: 'has no tags' },
  ],
  creator: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
}

// Operators that don't need a value input
const NO_VALUE_OPERATORS: ConditionOperator[] = ['is_empty', 'is_not_empty', 'is_set', 'is_not_set']

export function ConditionRow({ condition, onChange, onDelete, columns }: ConditionRowProps) {
  const operators = OPERATORS[condition.field] ?? OPERATORS.title
  const needsValue = !NO_VALUE_OPERATORS.includes(condition.operator)

  return (
    <div className="flex items-center gap-2">
      <Select
        value={condition.field}
        onValueChange={field => onChange({ ...condition, field, operator: 'equals', value: '' })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {FIELDS.map(f => (
            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={op => onChange({ ...condition, operator: op as ConditionOperator })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map(op => (
            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {needsValue && (
        condition.field === 'priority' ? (
          <Select
            value={String(condition.value ?? '')}
            onValueChange={v => onChange({ ...condition, value: v })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        ) : condition.field === 'status' ? (
          <Select
            value={String(condition.value ?? '')}
            onValueChange={v => onChange({ ...condition, value: v })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select column..." />
            </SelectTrigger>
            <SelectContent>
              {columns.map(col => (
                <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={String(condition.value ?? '')}
            onChange={e => onChange({ ...condition, value: e.target.value })}
            placeholder="Value..."
            className="flex-1"
          />
        )
      )}

      <Button variant="ghost" size="icon" onClick={onDelete} className="flex-shrink-0 h-9 w-9">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
