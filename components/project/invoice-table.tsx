"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { InvoiceDetailPanel } from "@/components/invoices/invoice-detail-panel"

interface InvoiceTableProps {
  projectId: string
  clientId?: string
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  sent: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  viewed: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  partially_paid: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  overdue: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  void: "bg-gray-100 dark:bg-gray-800 text-gray-500",
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
          <h3 className="text-lg font-semibold">Invoices</h3>
          <p className="text-sm text-gray-500">
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
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          No invoices for this project yet.
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                    onClick={() => {
                      setSelectedInvoiceId(inv.id)
                      setDetailOpen(true)
                    }}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inv.issue_date
                        ? new Date(inv.issue_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
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
