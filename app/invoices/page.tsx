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
  draft: { label: "Draft", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
  sent: { label: "Sent", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  viewed: { label: "Viewed", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  partially_paid: { label: "Partial", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" },
  paid: { label: "Paid", color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
  overdue: { label: "Overdue", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  void: { label: "Void", color: "bg-gray-100 dark:bg-gray-800 text-gray-500" },
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-sm text-gray-500 mt-1">
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
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-gray-500">Outstanding</p>
            </div>
            <p className="text-xl font-semibold">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
            <p className="text-xl font-semibold text-red-600">{formatCurrency(totalOverdue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-sm text-gray-500">Collected</p>
            </div>
            <p className="text-xl font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-500">Drafts</p>
            </div>
            <p className="text-xl font-semibold">{draftCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950"
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
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {invoices.length === 0
                ? "No invoices yet. Create your first one."
                : "No invoices match your filters."}
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filtered.map((inv) => {
                    const sc = statusConfig[inv.status] || statusConfig.draft
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                        onClick={() => {
                          setSelectedInvoiceId(inv.id)
                          setDetailOpen(true)
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{inv.invoice_number}</p>
                          {inv.project && (
                            <p className="text-xs text-gray-400">{inv.project.title}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
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
                            <span className="text-green-600">Paid</span>
                          ) : inv.status === "void" ? (
                            <span className="text-gray-400">Void</span>
                          ) : (
                            formatCurrency(Math.max(0, inv.amount_due))
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteTarget(inv)}>
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
              Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-gray-100">{deleteTarget?.invoice_number}</span>? This action cannot be undone.
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
