"use client"

import { useState, useEffect } from "react"
import { Send } from "lucide-react"
import { Spinner } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/lib/toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import type { ContractTemplate } from "./contract-template-list"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ContractTemplate | null
  onSent: () => void
}

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Project {
  id: string
  title: string
}

export function SendContractModal({ open, onOpenChange, template, onSent }: Props) {
  const { currentWorkspace, user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [signerName, setSignerName] = useState("")
  const [signerEmail, setSignerEmail] = useState("")
  const [contractName, setContractName] = useState("")
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [expiryDays, setExpiryDays] = useState("30")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open && currentWorkspace?.id) {
      loadClientsAndProjects()
      if (template) {
        setContractName(template.name)
        const vars: Record<string, string> = {}
        for (const v of template.variables) {
          vars[v] = ""
        }
        setVariableValues(vars)
      }
    }
  }, [open, currentWorkspace?.id, template])

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId)
      if (client) {
        setSignerName(`${client.firstName} ${client.lastName}`.trim())
        setSignerEmail(client.email || "")
        setVariableValues((prev) => ({
          ...prev,
          client_name: `${client.firstName} ${client.lastName}`.trim(),
          client_email: client.email || "",
        }))
      }
    }
  }, [selectedClientId, clients])

  const loadClientsAndProjects = async () => {
    const [c, p] = await Promise.all([
      supabase
        .from("clients")
        .select("id, first_name, last_name, email")
        .eq("business_id", currentWorkspace!.id)
        .is("archived_at", null)
        .order("first_name"),
      supabase
        .from("projects")
        .select("id, title")
        .eq("business_id", currentWorkspace!.id)
        .is("archived_at", null)
        .order("title"),
    ])

    setClients(
      (c.data || []).map((x: any) => ({
        id: x.id,
        firstName: x.first_name,
        lastName: x.last_name,
        email: x.email || "",
      }))
    )
    setProjects(
      (p.data || []).map((x: any) => ({ id: x.id, title: x.title }))
    )
  }

  const handleSend = async () => {
    if (!signerEmail.trim() || !signerName.trim()) {
      toast.error("Signer name and email are required")
      return
    }
    if (!currentWorkspace?.id || !template) return

    setSending(true)
    try {
      const res = await fetch("/api/contracts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: currentWorkspace.id,
          templateId: template.id,
          contractName: contractName.trim() || template.name,
          clientId: selectedClientId || null,
          projectId: selectedProjectId || null,
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim(),
          variableValues,
          expiryDays: parseInt(expiryDays) || 30,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to send contract")
      }

      const result = await res.json()
      if (result.emailWarning) {
        toast.warning("Contract created but email failed: " + result.emailWarning)
      } else {
        toast.success("Contract sent!")
      }
      onOpenChange(false)
      onSent()

      // Reset form
      setSelectedClientId("")
      setSelectedProjectId("")
      setSignerName("")
      setSignerEmail("")
      setContractName("")
      setVariableValues({})
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Contract</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Contract name */}
          <div>
            <label className="text-sm font-medium mb-1 block">Contract Name</label>
            <Input
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              placeholder="e.g. Service Agreement — Riverside Project"
            />
          </div>

          {/* Client */}
          <div>
            <label className="text-sm font-medium mb-1 block">Client (optional)</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="text-sm font-medium mb-1 block">Project (optional)</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Signer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Signer Name *</label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Signer Email *</label>
              <Input
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="john@example.com"
                type="email"
              />
            </div>
          </div>

          {/* Variable values */}
          {template && template.variables.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Template Variables</label>
              <div className="space-y-2">
                {template.variables.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <code className="text-xs bg-[--af-bg-surface-alt] dark:bg-warm-800 px-2 py-1 rounded min-w-[140px]">
                      {`{{${v}}}`}
                    </code>
                    <Input
                      value={variableValues[v] || ""}
                      onChange={(e) =>
                        setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))
                      }
                      placeholder={`Value for ${v}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiry */}
          <div>
            <label className="text-sm font-medium mb-1 block">Expires in (days)</label>
            <Input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              min="1"
              max="365"
              className="w-24"
            />
          </div>

          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
