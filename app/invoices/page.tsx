"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Loader2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { StatsCard } from "@/components/admin/stats-card"
import { InvoiceDetailPanel } from "@/components/invoices/invoice-detail-panel"
import { InvoiceSettingsForm } from "@/components/invoices/invoice-settings-form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Invoice {
  id: string
  invoice_number: string
  status: string
  total: number
  amount_due: number
  amount_paid: number
  issue_date: string | null
  due_date: string | null
  created_at: string
  client: { id: string; first_name: string; last_name: string; email: string } | null
  project: { id: string; title: string } | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-[--af-bg-surface-alt] text-[--af-text-secondary] border border-[--af-border-default]" },
  sent: { label: "Sent", color: "bg-[--af-info-bg] text-[--af-info-text] border border-[--af-info-border]" },
  viewed: { label: "Viewed", color: "bg-[--af-info-bg] text-[--af-info-text] border border-[--af-info-border]" },
  partially_paid: { label: "Partial", color: "bg-[--af-warning-bg] text-[--af-warning-text] border border-[--af-warning-border]" },
  paid: { label: "Paid", color: "bg-[--af-success-bg] text-[--af-success-text] border border-[--af-success-border]" },
  overdue: { label: "Overdue", color: "bg-[--af-danger-bg] text-[--af-danger-text] border border-[--af-danger-border]" },
  void: { label: "Void", color: "bg-[--af-bg-surface-alt] text-[--af-text-muted] border border-[--af-border-default]" },
}

function formatCurrency(val: number): string {
  return `$${parseFloat(String(val)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function InvoicesPage() {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (currentWorkspace) loadInvoices()
  }, [currentWorkspace?.id, statusFilter])

  const loadInvoices = async () => {
    if (!currentWorkspace) return
    setLoading(true)
    try {
      let url = `/api/invoices?businessId=${currentWorkspace.id}`
      if (statusFilter) url += `&status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) {
        setInvoices(await res.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const filtered = invoices.filter((inv) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      `${inv.client?.first_name || ""} ${inv.client?.last_name || ""}`.toLowerCase().includes(q) ||
      inv.project?.title?.toLowerCase().includes(q)
    )
  })

  // Stats
  const totalOutstanding = invoices
    .filter((i) => ["sent", "viewed", "partially_paid", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + parseFloat(String(i.amount_due)), 0)
  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + parseFloat(String(i.amount_due)), 0)
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + parseFloat(String(i.total)), 0)
  const draftCount = invoices.filter((i) => i.status === "draft").length

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/invoices/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to delete")
      }
      toast.success(`${deleteTarget.invoice_number} deleted`)
      setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (showSettings) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => setShowSettings(false)}>
              Back to Invoices
            </Button>
          </div>
          <InvoiceSettingsForm />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={{ padding: "var(--af-density-page-padding)", display: "flex", flexDirection: "column", gap: "var(--af-density-section-gap)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">Invoices</h1>
            <p className="text-sm text-[--af-text-muted] mt-1">
              Create, send, and track invoices for your projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-1" /> Settings
            </Button>
            <Button onClick={() => router.push("/invoices/new")}>
              <Plus className="w-4 h-4 mr-1" /> Create Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard variant="compact" title="Outstanding" value={formatCurrency(totalOutstanding)} icon={DollarSign} />
          <StatsCard variant="compact" title="Overdue" value={formatCurrency(totalOverdue)} icon={AlertTriangle} valueColor="danger" />
          <StatsCard variant="compact" title="Collected" value={formatCurrency(totalPaid)} icon={CheckCircle2} valueColor="success" />
          <StatsCard variant="compact" title="Drafts" value={draftCount} icon={Clock} />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--af-text-muted]" />
            <Input
              placeholder="Search invoices..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-[--af-radius-input] border border-[--af-border-default] bg-[--af-bg-input] px-3 text-[13px] transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[--af-text-muted]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-[--af-text-muted] mx-auto mb-3" />
            <p className="text-[--af-text-muted] text-sm">
              {invoices.length === 0
                ? "No invoices yet. Create your first one."
                : "No invoices match your filters."}
            </p>
          </div>
        ) : (
          <div className="border border-[--af-border-default] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[--af-bg-surface-alt]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Invoice</th>
                    <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Client</th>
                    <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Total</th>
                    <th className="px-4 py-3 text-right text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Balance</th>
                    <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Due Date</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--af-border-default] dark:divide-warm-800">
                  {filtered.map((inv) => {
                    const sc = statusConfig[inv.status] || statusConfig.draft
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-[--af-bg-surface-alt] cursor-pointer"
                        onClick={() => {
                          setSelectedInvoiceId(inv.id)
                          setDetailOpen(true)
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{inv.invoice_number}</p>
                          {inv.project && (
                            <p className="text-xs text-[--af-text-muted]">{inv.project.title}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[--af-text-secondary]">
                          {inv.client ? `${inv.client.first_name || ""} ${inv.client.last_name || ""}`.trim() || "—" : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-right">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {inv.status === "paid" ? (
                            <span className="text-[--af-success-text]">Paid</span>
                          ) : inv.status === "void" ? (
                            <span className="text-[--af-text-muted]">Void</span>
                          ) : (
                            formatCurrency(Math.max(0, inv.amount_due))
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[--af-text-muted]">
                          {inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md hover:bg-[--af-bg-surface-alt] text-[--af-text-muted] hover:text-[--af-text-secondary] dark:hover:text-[--af-text-muted]">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedInvoiceId(inv.id); setDetailOpen(true) }}>
                                <Eye className="w-4 h-4 mr-2" /> View
                              </DropdownMenuItem>
                              {inv.status === "draft" && (
                                <DropdownMenuItem onClick={() => router.push(`/invoices/${inv.id}/edit`)}>
                                  <Pencil className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                              )}
                              {inv.status === "draft" && (
                                <DropdownMenuItem className="text-[--af-danger-text] focus:text-[--af-danger-text]" onClick={() => setDeleteTarget(inv)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <InvoiceDetailPanel
        invoiceId={selectedInvoiceId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={loadInvoices}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.invoice_number}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
