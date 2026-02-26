"use client"

import { useState, useEffect } from 'react'
import { Search, Zap, X, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import type { FlowRecipeTemplate, FlowRecipeTemplateRow } from '@/types/flow-automation'
import { flowRecipeFromRow } from '@/types/flow-automation'

interface RecipePickerProps {
  boardId: string
  open: boolean
  onSelectTemplate: (template: FlowRecipeTemplate) => void
  onBuildFromScratch: () => void
  onClose: () => void
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'sales', label: 'Sales' },
  { key: 'development', label: 'Development' },
  { key: 'finance', label: 'Finance' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'ai', label: 'AI-Powered' },
]

const CATEGORY_COLORS: Record<string, string> = {
  sales: 'bg-blue-100 text-blue-700',
  development: 'bg-purple-100 text-purple-700',
  finance: 'bg-green-100 text-green-700',
  onboarding: 'bg-orange-100 text-orange-700',
  productivity: 'bg-gray-100 text-gray-700',
  ai: 'bg-violet-100 text-violet-700',
}

export function RecipePicker({ boardId, open, onSelectTemplate, onBuildFromScratch, onClose }: RecipePickerProps) {
  const [templates, setTemplates] = useState<FlowRecipeTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    if (!open) return

    async function fetchTemplates() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('flow_recipe_templates')
        .select('*')
        .order('sort_order')

      if (!error && data) {
        setTemplates((data as FlowRecipeTemplateRow[]).map(flowRecipeFromRow))
      }
      setIsLoading(false)
    }

    fetchTemplates()
  }, [open])

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = activeCategory === 'all' || t.category.toLowerCase() === activeCategory
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featured = filteredTemplates.filter(t => t.isFeatured)
  const regular = filteredTemplates.filter(t => !t.isFeatured)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            New Flow Automation
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mb-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="scratch">Build from Scratch</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="flex-1 flex flex-col min-h-0">
            {/* Search + category filters */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      activeCategory === cat.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No templates found</p>
                  <p className="text-sm">Try a different search or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[...featured, ...regular].map(template => (
                    <RecipeCard
                      key={template.id}
                      template={template}
                      onSelect={() => onSelectTemplate(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="scratch" className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Build from Scratch</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create a custom flow automation by choosing your own trigger, conditions, and actions.
              </p>
              <Button onClick={onBuildFromScratch} size="lg">
                Start Building
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function RecipeCard({ template, onSelect }: { template: FlowRecipeTemplate; onSelect: () => void }) {
  const hasComingSoon = template.actions.some(a => (a.config as Record<string, unknown>)?.comingSoon)
  const categoryColor = CATEGORY_COLORS[template.category.toLowerCase()] ?? 'bg-gray-100 text-gray-700'

  return (
    <button
      onClick={onSelect}
      className="text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all group relative"
    >
      {template.isFeatured && (
        <div className="absolute top-2 right-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryColor}`}>
          <Zap className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{template.name}</span>
          </div>
          {template.previewSummary && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {template.previewSummary}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {template.category}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {template.actions.length} action{template.actions.length !== 1 ? 's' : ''}
            </Badge>
            {hasComingSoon && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                Coming soon
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
