"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Ban,
  Mail,
  Clock,
  CheckCircle2,
  Eye,
  XCircle,
  FileText,
  ExternalLink,
  Copy,
} from "lucide-react"
import { Spinner } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppLayout } from "@/components/layout/app-layout"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { toast } from "@/lib/toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

interface ContractDetail {
  id: string
  name: string
  type: "rich_text" | "pdf"
  content: any
  pdfUrl: string | null
  status: string
  signerName: string
  signerEmail: string
  signerIp: string | null
  signatureData: string | null
  clientId: string | null
  clientName: string | null
  projectId: string | null
  projectTitle: string | null
  variableValues: Record<string, string>
  signingToken: string
  tokenExpiresAt: string | null
  sentAt: string | null
  viewedAt: string | null
  signedAt: string | null
  declinedAt: string | null
  createdAt: string
}

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reminding, setReminding] = useState(false)
  const [voiding, setVoiding] = useState(false)

  useEffect(() => {
    loadContract()
  }, [params.id])

  const loadContract = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error) throw error

      // Load client/project names
      let clientName: string | null = null
      let projectTitle: string | null = null

      if (data.client_id) {
        const { data: c } = await supabase
          .from("clients")
          .select("first_name, last_name")
          .eq("id", data.client_id)
          .single()
        if (c) clientName = `${c.first_name} ${c.last_name}`.trim()
      }

      if (data.project_id) {
        const { data: p } = await supabase
          .from("projects")
          .select("title")
          .eq("id", data.project_id)
          .single()
        if (p) projectTitle = p.title
      }

      setContract({
        id: data.id,
        name: data.name,
        type: data.type,
        content: data.content,
        pdfUrl: data.pdf_url,
        status: data.status,
        signerName: data.signer_name,
        signerEmail: data.signer_email,
        signerIp: data.signer_ip,
        signatureData: data.signature_data,
        clientId: data.client_id,
        clientName,
        projectId: data.project_id,
        projectTitle,
        variableValues: data.variable_values || {},
        signingToken: data.signing_token,
        tokenExpiresAt: data.token_expires_at,
        sentAt: data.sent_at,
        viewedAt: data.viewed_at,
        signedAt: data.signed_at,
        declinedAt: data.declined_at,
        createdAt: data.created_at,
      })
    } catch (err: any) {
      toast.error("Failed to load contract: " + err.message)
      router.push("/contracts")
    } finally {
      setLoading(false)
    }
  }

  const handleRemind = async () => {
    setReminding(true)
    try {
      const res = await fetch(`/api/contracts/${params.id}/remind`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to send reminder")
      }
      toast.success("Reminder sent!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setReminding(false)
    }
  }

  const handleVoid = async () => {
    setVoiding(true)
    try {
      const res = await fetch(`/api/contracts/${params.id}/void`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to void contract")
      }
      toast.success("Contract voided")
      loadContract()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setVoiding(false)
    }
  }

  const copySigningLink = () => {
    if (!contract) return
    const url = `${window.location.origin}/sign/${contract.signingToken}`
    navigator.clipboard.writeText(url)
    toast.success("Signing link copied!")
  }

  const renderContent = (json: any): string => {
    if (!json || !json.content) return ""
    const renderNode = (node: any): string => {
      if (node.type === "text") {
        let text = node.text || ""
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === "bold") text = `<strong>${text}</strong>`
            if (mark.type === "italic") text = `<em>${text}</em>`
          }
        }
        return text
      }
      const children = (node.content || []).map(renderNode).join("")
      switch (node.type) {
        case "paragraph":
          return `<p>${children || "&nbsp;"}</p>`
        case "heading": {
          const level = node.attrs?.level || 1
          return `<h${level}>${children}</h${level}>`
        }
        case "bulletList":
          return `<ul>${children}</ul>`
        case "orderedList":
          return `<ol>${children}</ol>`
        case "listItem":
          return `<li>${children}</li>`
        case "doc":
          return children
        default:
          return children
      }
    }
    return renderNode(json)
  }

  const timelineEvents = contract
    ? [
        { label: "Created", date: contract.createdAt, icon: FileText, done: true },
        { label: "Sent", date: contract.sentAt, icon: Send, done: !!contract.sentAt },
        { label: "Viewed", date: contract.viewedAt, icon: Eye, done: !!contract.viewedAt },
        {
          label: contract.status === "declined" ? "Declined" : contract.status === "expired" ? "Expired" : "Signed",
          date: contract.signedAt || contract.declinedAt,
          icon: contract.status === "declined" ? XCircle : contract.status === "expired" ? Ban : CheckCircle2,
          done: !!contract.signedAt || !!contract.declinedAt || contract.status === "expired",
        },
      ]
    : []

  const canRemind = contract && ["sent", "viewed"].includes(contract.status)
  const canVoid = contract && ["sent", "viewed"].includes(contract.status)

  return (
    <AppLayout>
      <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-950">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[--af-bg-surface] border-b border-[--af-border-default]">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/contracts")}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {loading ? (
                  <div>
                    <div className="h-8 w-48 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded animate-pulse mt-2" />
                  </div>
                ) : contract ? (
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight truncate">{contract.name}</h1>
                      <ContractStatusBadge status={contract.status} />
                    </div>
                    <p className="text-sm text-[--af-text-muted] mt-1">
                      {contract.signerName} · {contract.signerEmail}
                    </p>
                  </div>
                ) : null}
              </div>

              {contract && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                  {canRemind && (
                    <Button variant="outline" onClick={handleRemind} disabled={reminding}>
                      {reminding ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Send Reminder
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={copySigningLink}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Signing Link
                      </DropdownMenuItem>
                      {canRemind && (
                        <DropdownMenuItem onClick={handleRemind} disabled={reminding}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Reminder
                        </DropdownMenuItem>
                      )}
                      {canVoid && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={handleVoid}
                            disabled={voiding}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Void Contract
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {contract && (
          <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
            {/* Timeline + Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline */}
              <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                <h2 className="text-sm font-semibold mb-4">Timeline</h2>
                <div className="space-y-4">
                  {timelineEvents.map((event, i) => {
                    const Icon = event.icon
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            event.done
                              ? "bg-[--af-success-bg] text-[--af-success-text]"
                              : "bg-[--af-bg-surface-alt] text-[--af-text-muted]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${event.done ? "" : "text-[--af-text-muted]"}`}>
                            {event.label}
                          </p>
                          {event.date && (
                            <p className="text-xs text-[--af-text-muted]">
                              {new Date(event.date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {contract.tokenExpiresAt && !["signed", "expired", "declined"].includes(contract.status) && (
                  <div className="mt-4 pt-4 border-t border-[--af-border-default]/50 dark:border-foreground">
                    <div className="flex items-center gap-2 text-xs text-[--af-text-muted]">
                      <Clock className="w-3.5 h-3.5" />
                      Expires {new Date(contract.tokenExpiresAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Contract Details */}
              <div className="lg:col-span-2 bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                <h2 className="text-sm font-semibold mb-4">Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[--af-text-muted] mb-0.5">Signer</p>
                    <p className="text-sm font-medium">{contract.signerName}</p>
                    <p className="text-xs text-[--af-text-muted]">{contract.signerEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[--af-text-muted] mb-0.5">Client</p>
                    {contract.clientId ? (
                      <button
                        className="text-sm font-medium hover:underline flex items-center gap-1"
                        onClick={() => router.push(`/clients/${contract.clientId}`)}
                      >
                        {contract.clientName || "—"}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <p className="text-sm text-[--af-text-muted]">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[--af-text-muted] mb-0.5">Project</p>
                    {contract.projectId ? (
                      <button
                        className="text-sm font-medium hover:underline flex items-center gap-1"
                        onClick={() => router.push(`/projects/${contract.projectId}`)}
                      >
                        {contract.projectTitle || "—"}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <p className="text-sm text-[--af-text-muted]">—</p>
                    )}
                  </div>
                  {contract.signerIp && (
                    <div>
                      <p className="text-xs text-[--af-text-muted] mb-0.5">Signer IP</p>
                      <p className="text-sm font-mono">{contract.signerIp}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature */}
            {contract.signatureData && (
              <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
                <h2 className="text-sm font-semibold mb-4">Signature</h2>
                <div className="border border-[--af-border-default] rounded-lg p-4 bg-[--af-bg-canvas] dark:bg-warm-900 inline-block">
                  <img
                    src={contract.signatureData}
                    alt="Signature"
                    className="max-h-24"
                  />
                </div>
                <p className="text-xs text-[--af-text-muted] mt-2">
                  Signed by {contract.signerName} on{" "}
                  {contract.signedAt ? new Date(contract.signedAt).toLocaleString() : "—"}
                </p>
              </div>
            )}

            {/* Contract Content */}
            <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6">
              <h2 className="text-sm font-semibold mb-4">Contract Content</h2>
              {contract.type === "rich_text" && contract.content ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderContent(contract.content) }}
                />
              ) : contract.pdfUrl ? (
                <iframe
                  src={contract.pdfUrl}
                  className="w-full h-[600px] rounded"
                  title="Contract PDF"
                />
              ) : (
                <p className="text-sm text-[--af-text-muted]">No content available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
