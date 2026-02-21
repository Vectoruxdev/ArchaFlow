"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, MoreVertical, FileText, FileUp, Copy, Archive, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/lib/toast"
import { supabase } from "@/lib/supabase/client"
import { SendContractModal } from "./send-contract-modal"

export interface ContractTemplate {
  id: string
  name: string
  description: string | null
  type: "rich_text" | "pdf"
  variables: string[]
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

interface Props {
  templates: ContractTemplate[]
  businessId: string
  onRefresh: () => void
}

export function ContractTemplateList({ templates, businessId, onRefresh }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [sendTemplate, setSendTemplate] = useState<ContractTemplate | null>(null)

  const createTemplate = async () => {
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .insert({
          business_id: businessId,
          name: "Untitled Template",
          type: "rich_text",
          content: { type: "doc", content: [{ type: "paragraph" }] },
          variables: [],
        })
        .select("id")
        .single()

      if (error) throw error
      router.push(`/contracts/templates/${data.id}`)
    } catch (err: any) {
      toast.error("Failed to create template: " + err.message)
    } finally {
      setCreating(false)
    }
  }

  const duplicateTemplate = async (template: ContractTemplate) => {
    try {
      const { data: original, error: fetchErr } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("id", template.id)
        .single()

      if (fetchErr) throw fetchErr

      const { data, error } = await supabase
        .from("contract_templates")
        .insert({
          business_id: businessId,
          name: `${original.name} (Copy)`,
          description: original.description,
          type: original.type,
          content: original.content,
          pdf_url: original.pdf_url,
          variables: original.variables,
        })
        .select("id")
        .single()

      if (error) throw error
      toast.success("Template duplicated")
      onRefresh()
    } catch (err: any) {
      toast.error("Failed to duplicate: " + err.message)
    }
  }

  const archiveTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contract_templates")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      toast.success("Template archived")
      onRefresh()
    } catch (err: any) {
      toast.error("Failed to archive: " + err.message)
    }
  }

  const activeTemplates = templates.filter((t) => !t.archivedAt)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-display font-bold">Templates</h2>
          <p className="text-sm text-[--af-text-muted]">
            Reusable contract templates with variable support
          </p>
        </div>
        <Button onClick={createTemplate} disabled={creating}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {activeTemplates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[--af-border-default] rounded-lg">
          <FileText className="w-10 h-10 text-[--af-text-muted] dark:text-[--af-text-secondary] mx-auto mb-3" />
          <p className="text-sm text-[--af-text-muted] mb-4">
            No templates yet. Create your first contract template.
          </p>
          <Button onClick={createTemplate} disabled={creating} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-5 hover:border-[--af-border-strong] transition-colors cursor-pointer"
              onClick={() => router.push(`/contracts/templates/${template.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[--af-bg-surface-alt] flex items-center justify-center">
                  {template.type === "pdf" ? (
                    <FileUp className="w-4 h-4 text-[--af-text-muted]" />
                  ) : (
                    <FileText className="w-4 h-4 text-[--af-text-muted]" />
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => setSendTemplate(template)}>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/contracts/templates/${template.id}`)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-orange-600"
                      onClick={() => archiveTemplate(template.id)}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-medium text-sm truncate">{template.name}</h3>
              {template.description && (
                <p className="text-xs text-[--af-text-muted] mt-1 line-clamp-2">
                  {template.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-[--af-text-muted] capitalize">{template.type.replace("_", " ")}</span>
                {template.variables.length > 0 && (
                  <span className="text-xs text-[--af-text-muted]">
                    · {template.variables.length} variable{template.variables.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SendContractModal
        open={!!sendTemplate}
        onOpenChange={(open) => { if (!open) setSendTemplate(null) }}
        template={sendTemplate}
        onSent={onRefresh}
      />
    </div>
  )
}
