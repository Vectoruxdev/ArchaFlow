"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Send,
  DollarSign,
  Ban,
  Plus,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import { SendInvoiceModal } from "./send-invoice-modal"
import { RecordPaymentModal } from "./record-payment-modal"
import { ChangeOrderModal } from "./change-order-modal"

interface InvoiceDetailPanelProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

function formatCurrency(val: number): string {
  return `$${parseFloat(String(val)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function clientName(client: any): string {
  if (!client) return ""
  return `${client.first_name || ""} ${client.last_name || ""}`.trim() || client.email || "Unnamed"
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", icon: Send },
  viewed: { label: "Viewed", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", icon: Eye },
  partially_paid: { label: "Partially Paid", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400", icon: AlertTriangle },
  paid: { label: "Paid", color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400", icon: AlertTriangle },
  void: { label: "Void", color: "bg-gray-100 dark:bg-gray-800 text-gray-500", icon: XCircle },
}

export function InvoiceDetailPanel({
  invoiceId,
  open,
  onOpenChange,
  onUpdated,
}: InvoiceDetailPanelProps) {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [changeOrderModalOpen, setChangeOrderModalOpen] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (invoiceId && open) {
      loadInvoice()
    }
    if (!open) {
      setInvoice(null)
    }
  }, [invoiceId, open])

  const loadInvoice = async () => {
    if (!invoiceId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (res.ok) {
        setInvoice(await res.json())
      } else {
        const body = await res.json().catch(() => ({}))
        console.error("Load invoice failed:", body)
      }
    } catch (err) {
      console.error("Load invoice error:", err)
      toast.error("Failed to load invoice")
    } finally {
      setLoading(false)
    }
  }

  const handleVoid = async () => {
    if (!invoice || !confirm("Are you sure you want to void this invoice? This cannot be undone.")) return
    setVoiding(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Voided by user" }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to void invoice")
      }
      toast.success("Invoice voided")
      loadInvoice()
      onUpdated?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setVoiding(false)
    }
  }

  const handleDelete = async () => {
    if (!invoice || !confirm("Delete this draft invoice? This cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to delete")
      }
      toast.success("Invoice deleted")
      onOpenChange(false)
      onUpdated?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = () => {
    if (!invoice) return
    onOpenChange(false)
    router.push(`/invoices/${invoice.id}/edit`)
  }

  const handleApproveChangeOrder = async (coId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/change-order/${coId}/approve`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to approve")
      }
      toast.success("Change order approved")
      loadInvoice()
      onUpdated?.()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const sc = statusConfig[invoice?.status] || statusConfig.draft

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : invoice ? (
            <>
              {/* Header bar */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold">{invoice.invoice_number}</h2>
                        <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {clientName(invoice.client) || "No client"}
                        {invoice.project?.name && ` · ${invoice.project.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice.status === "draft" && (
                      <>
                        <Button size="sm" variant="outline" onClick={handleEdit}>
                          <Pencil className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" onClick={() => setSendModalOpen(true)}>
                          <Send className="w-4 h-4 mr-1" /> Send
                        </Button>
                      </>
                    )}
                    {["sent", "viewed", "overdue", "partially_paid"].includes(invoice.status) && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setSendModalOpen(true)}>
                          <Send className="w-4 h-4 mr-1" /> Resend
                        </Button>
                        <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
                          <DollarSign className="w-4 h-4 mr-1" /> Record Payment
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Amount summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                    <p className="text-lg font-semibold">{formatCurrency(invoice.subtotal)}</p>
                  </div>
                  {parseFloat(invoice.tax_rate) > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Tax ({invoice.tax_rate}%)</p>
                      <p className="text-lg font-semibold">{formatCurrency(invoice.tax_amount)}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="text-lg font-bold">{formatCurrency(invoice.total)}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${invoice.status === "paid" ? "bg-green-50 dark:bg-green-900/10" : "bg-gray-50 dark:bg-gray-900"}`}>
                    <p className="text-xs text-gray-500 mb-1">Balance Due</p>
                    <p className={`text-lg font-bold ${invoice.status === "paid" ? "text-green-600" : ""}`}>
                      {invoice.status === "paid" ? "Paid" : formatCurrency(Math.max(0, invoice.amount_due))}
                    </p>
                  </div>
                </div>

                {/* Dates row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
                    <p className="font-medium">{invoice.issue_date ? formatDate(invoice.issue_date) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                    <p className="font-medium">{invoice.due_date ? formatDate(invoice.due_date) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Terms</p>
                    <p className="font-medium">{invoice.payment_terms || "—"}</p>
                  </div>
                  {invoice.sent_at && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sent</p>
                      <p className="font-medium">{formatDate(invoice.sent_at)}</p>
                    </div>
                  )}
                </div>

                {/* Client info */}
                {invoice.client && (
                  <div className="text-sm">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Client</p>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-0.5">
                      <p className="font-medium">{clientName(invoice.client)}</p>
                      {invoice.client.email && <p className="text-gray-500">{invoice.client.email}</p>}
                      {invoice.client.phone && <p className="text-gray-500">{invoice.client.phone}</p>}
                    </div>
                  </div>
                )}

                {/* Line Items */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Line Items</p>
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Description</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Price</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {invoice.line_items?.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2.5">{item.description}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">{item.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                        {(!invoice.line_items || invoice.line_items.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-gray-400 text-sm">No line items</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payments */}
                {invoice.payments?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Payments</p>
                    <div className="space-y-2">
                      {invoice.payments.map((p: any) => (
                        <div key={p.id} className="flex justify-between text-sm bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg px-4 py-2.5">
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatDate(p.payment_date)} · {p.payment_method?.replace("_", " ")}
                            {p.reference_number && ` · Ref: ${p.reference_number}`}
                          </span>
                          <span className="font-medium text-green-600">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Change Orders */}
                {invoice.change_orders?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Change Orders</p>
                    <div className="space-y-2">
                      {invoice.change_orders.map((co: any) => (
                        <div key={co.id} className="border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">CO #{co.change_order_number}: {co.title}</p>
                              {co.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{co.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${co.amount >= 0 ? "" : "text-green-600"}`}>
                                {co.amount >= 0 ? "+" : ""}{formatCurrency(co.amount)}
                              </span>
                              {co.status === "pending" && (
                                <Button size="sm" variant="outline" onClick={() => handleApproveChangeOrder(co.id)}>
                                  Approve
                                </Button>
                              )}
                              <Badge className={`text-xs ${
                                co.status === "approved"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                  : co.status === "rejected"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                              }`}>
                                {co.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {invoice.notes && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    {!["paid", "void"].includes(invoice.status) && (
                      <Button size="sm" variant="outline" onClick={() => setChangeOrderModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Change Order
                      </Button>
                    )}
                    {invoice.viewing_token && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/invoice/${invoice.viewing_token}`, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" /> Public Link
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!["paid", "void"].includes(invoice.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleVoid}
                        disabled={voiding}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        {voiding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Ban className="w-4 h-4 mr-1" />}
                        Void
                      </Button>
                    )}
                    {invoice.status === "draft" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-500">Invoice not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      {invoice && (
        <>
          <SendInvoiceModal
            open={sendModalOpen}
            onOpenChange={setSendModalOpen}
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
            clientEmail={invoice.client?.email || ""}
            clientName={clientName(invoice.client)}
            onSent={() => {
              loadInvoice()
              onUpdated?.()
            }}
          />
          <RecordPaymentModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
            amountDue={invoice.amount_due}
            onRecorded={() => {
              loadInvoice()
              onUpdated?.()
            }}
          />
          <ChangeOrderModal
            open={changeOrderModalOpen}
            onOpenChange={setChangeOrderModalOpen}
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
            onCreated={() => {
              loadInvoice()
              onUpdated?.()
            }}
          />
        </>
      )}
    </>
  )
}
