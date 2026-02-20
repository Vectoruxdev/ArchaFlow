"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/layout/app-layout"
import { ContractTemplateEditor } from "@/components/contracts/contract-template-editor"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

export default function TemplateEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState<any>(null)
  const [type, setType] = useState<"rich_text" | "pdf">("rich_text")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [params.id])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error) throw error

      setName(data.name)
      setDescription(data.description || "")
      setContent(data.content || { type: "doc", content: [{ type: "paragraph" }] })
      setType(data.type)
    } catch (err: any) {
      toast.error("Failed to load template: " + err.message)
      router.push("/contracts")
    } finally {
      setLoading(false)
    }
  }

  // Extract variables from content
  const extractVariables = useCallback((json: any): string[] => {
    const text = JSON.stringify(json)
    const matches = text.match(/\{\{(\w+)\}\}/g) || []
    return [...new Set(matches.map((m: string) => m.replace(/\{\{|\}\}/g, "")))]
  }, [])

  const saveName = async (newName: string) => {
    const trimmed = newName.trim() || "Untitled Template"
    try {
      const { error } = await supabase
        .from("contract_templates")
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq("id", params.id)

      if (error) throw error
      setName(trimmed)
    } catch (err: any) {
      toast.error("Failed to save name: " + err.message)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const variables = extractVariables(content)

      const { error } = await supabase
        .from("contract_templates")
        .update({
          name: name.trim() || "Untitled Template",
          description: description.trim() || null,
          content,
          variables,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error
      toast.success("Template saved")
    } catch (err: any) {
      toast.error("Failed to save: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-950">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[--af-bg-surface] border-b border-[--af-border-default]">
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => router.push("/contracts")}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {loading ? (
                  <div className="h-8 w-48 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse" />
                ) : (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xl font-display font-bold tracking-tight border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent max-w-md"
                    placeholder="Template name"
                  />
                )}
              </div>
              <Button onClick={save} disabled={saving || loading}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 max-w-4xl mx-auto">
          {loading ? (
            <div className="h-96 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded-lg animate-pulse" />
          ) : type === "rich_text" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Template Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={(e) => saveName(e.target.value)}
                  placeholder="Template name"
                  className="text-lg font-display font-bold"
                />
              </div>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Template description (optional)"
                className="text-sm"
              />
              <ContractTemplateEditor content={content} onChange={setContent} />
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[--af-border-default] rounded-lg">
              <p className="text-sm text-[--af-text-muted]">
                PDF template viewer — upload support coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
