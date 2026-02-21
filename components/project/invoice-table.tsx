"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { Spinner } from "@/components/design-system"
import { useAuth } from "@/lib/auth/auth-context"
import { InvoiceDetailPanel } from "@/components/invoices/invoice-detail-panel"

interface InvoiceTableProps {
  projectId: string
  clientId?: string
}

const statusColors: Record<string, string> = {
  draft: "bg-[--af-bg-surface-alt] dark:bg-warm-800 text-[--af-text-secondary]",
  sent: "bg-[--af-info-bg] text-[--af-info-text]",
  viewed: "bg-[--af-info-bg] text-[--af-info-text]",
  partially_paid: "bg-[--af-warning-bg] text-[--af-warning-text]",
  paid: "bg-[--af-success-bg] text-[--af-success-text]",
  overdue: "bg-[--af-danger-bg] text-[--af-danger-text]",
  void: "bg-[--af-bg-surface-alt] dark:bg-warm-800 text-[--af-text-muted]",
}

function formatCurrency(val: number): string {
  return `$${parseFloat(String(val)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function InvoiceTable({ projectId, clientId }: InvoiceTableProps) {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (currentWorkspace) loadInvoices()
  }, [currentWorkspace?.id, projectId])

  const loadInvoices = async () => {
    if (!currentWorkspace) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/invoices?businessId=${currentWorkspace.id}&projectId=${projectId}`
      )
      if (res.ok) {
        setInvoices(await res.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(String(inv.total)), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold">Invoices</h3>
          <p className="text-sm text-[--af-text-muted]">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} · Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <Button onClick={() => router.push("/invoices/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-8 text-sm text-[--af-text-muted]">
          No invoices for this project yet.
        </div>
      ) : (
        <div className="border border-[--af-border-default] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[--af-bg-surface-alt]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--af-border-default] dark:divide-warm-800">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[--af-bg-surface-alt] cursor-pointer"
                    onClick={() => {
                      setSelectedInvoiceId(inv.id)
                      setDetailOpen(true)
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-[--af-text-muted]">
                      {inv.issue_date
                        ? new Date(inv.issue_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[--af-text-muted]">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${statusColors[inv.status] || ""}`}>
                        {inv.status === "partially_paid" ? "Partial" : inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InvoiceDetailPanel
        invoiceId={selectedInvoiceId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={loadInvoices}
      />
    </div>
  )
}
