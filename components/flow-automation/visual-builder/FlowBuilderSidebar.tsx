"use client"

import { useState } from 'react'
import { Plus, Zap, Search, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { FlowRule } from '@/types/flow-automation'

interface FlowBuilderSidebarProps {
  rules: FlowRule[]
  selectedRuleId?: string
  onSelectRule: (ruleId: string) => void
  onToggleActive: (ruleId: string) => void
  onNewFlow: () => void
  onRenameRule: (ruleId: string, name: string) => void
}

export function FlowBuilderSidebar({
  rules,
  selectedRuleId,
  onSelectRule,
  onToggleActive,
  onNewFlow,
  onRenameRule,
}: FlowBuilderSidebarProps) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const filteredRules = rules.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = rules.filter(r => r.isActive).length

  function startRename(rule: FlowRule) {
    setEditingId(rule.id)
    setEditName(rule.name)
  }

  function commitRename(ruleId: string) {
    if (editName.trim() && editName.trim() !== rules.find(r => r.id === ruleId)?.name) {
      onRenameRule(ruleId, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="w-[280px] h-full border-r border-border bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Flows</h3>
            {activeCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700">
                {activeCount} active
              </Badge>
            )}
          </div>
          <Button size="sm" className="h-7 text-xs" onClick={onNewFlow}>
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search flows..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Flow List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredRules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              {search ? 'No flows match your search' : 'No flows yet'}
            </p>
          </div>
        ) : (
          filteredRules.map(rule => (
            <button
              key={rule.id}
              onClick={() => onSelectRule(rule.id)}
              className={`w-full text-left rounded-lg p-2.5 transition-colors ${
                selectedRuleId === rule.id
                  ? 'bg-accent'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  {editingId === rule.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => commitRename(rule.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(rule.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="w-full text-sm font-medium bg-transparent border-b border-primary outline-none"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <p
                      className="text-sm font-medium truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        startRename(rule)
                      }}
                    >
                      {rule.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                    </span>
                    {rule.runCount > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {rule.runCount} run{rule.runCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={(e) => {
                    e // prevent event from bubbling
                    onToggleActive(rule.id)
                  }}
                  onClick={e => e.stopPropagation()}
                  className="scale-75"
                />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Double-click a flow name to rename
        </p>
      </div>
    </div>
  )
}
