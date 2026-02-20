"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  const { currentWorkspace } = useAuth()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [changeOrderModalOpen, setChangeOrderModalOpen] = useState(false)
  const [voiding, setVoiding] = useState(false)

  useEffect(() => {
    if (invoiceId && open) {
      loadInvoice()
    }
  }, [invoiceId, open])

  const loadInvoice = async () => {
    if (!invoiceId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (res.ok) {
        setInvoice(await res.json())
      }
    } catch {
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
    if (!invoice || !confirm("Delete this draft invoice?")) return
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
    }
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice Details</SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : invoice ? (
            <div className="mt-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{invoice.invoice_number}</h2>
                  <p className="text-sm text-gray-500">
                    {invoice.client ? `${invoice.client.first_name || ""} ${invoice.client.last_name || ""}`.trim() || "No client" : "No client"}
                    {invoice.project?.name && ` · ${invoice.project.name}`}
                  </p>
                </div>
                <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {invoice.status === "draft" && (
                  <>
                    <Button size="sm" onClick={() => setSendModalOpen(true)}>
                      <Send className="w-4 h-4 mr-1" /> Send
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDelete}>
                      Delete Draft
                    </Button>
                  </>
                )}
                {["sent", "viewed", "overdue", "partially_paid"].includes(invoice.status) && (
                  <>
                    <Button size="sm" onClick={() => setSendModalOpen(true)}>
                      <Send className="w-4 h-4 mr-1" /> Resend
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPaymentModalOpen(true)}>
                      <DollarSign className="w-4 h-4 mr-1" /> Record Payment
                    </Button>
                  </>
                )}
                {!["paid", "void"].includes(invoice.status) && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setChangeOrderModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Change Order
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleVoid}
                      disabled={voiding}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Ban className="w-4 h-4 mr-1" /> Void
                    </Button>
                  </>
                )}
                {invoice.viewing_token && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`/invoice/${invoice.viewing_token}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" /> View Link
                  </Button>
                )}
              </div>

              {/* Amounts */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {parseFloat(invoice.tax_rate) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium border-t border-gray-200 dark:border-gray-800 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                {parseFloat(invoice.amount_paid) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-800 pt-2">
                  <span>Balance Due</span>
                  <span>{formatCurrency(Math.max(0, invoice.amount_due))}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Issue Date</p>
                  <p>{invoice.issue_date ? formatDate(invoice.issue_date) : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due Date</p>
                  <p>{invoice.due_date ? formatDate(invoice.due_date) : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Terms</p>
                  <p>{invoice.payment_terms || "—"}</p>
                </div>
                {invoice.sent_at && (
                  <div>
                    <p className="text-gray-500">Sent</p>
                    <p>{formatDate(invoice.sent_at)}</p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Line Items</h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {invoice.line_items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{formatCurrency(item.unit_price)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments */}
              {invoice.payments?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Payments</h3>
                  <div className="space-y-2">
                    {invoice.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-sm bg-green-50 dark:bg-green-900/10 rounded-lg px-3 py-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(p.payment_date)} · {p.payment_method.replace("_", " ")}
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
                  <h3 className="text-sm font-semibold mb-2">Change Orders</h3>
                  <div className="space-y-2">
                    {invoice.change_orders.map((co: any) => (
                      <div key={co.id} className="border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">CO #{co.change_order_number}: {co.title}</p>
                            {co.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{co.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${co.amount >= 0 ? "text-gray-900 dark:text-gray-100" : "text-green-600"}`}>
                              {co.amount >= 0 ? "+" : ""}{formatCurrency(co.amount)}
                            </span>
                            {co.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveChangeOrder(co.id)}
                              >
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
                  <h3 className="text-sm font-semibold mb-1">Notes</h3>
                  <p className="text-sm text-gray-500 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.internal_notes && (
                <div>
                  <h3 className="text-sm font-semibold mb-1">Internal Notes</h3>
                  <p className="text-sm text-gray-500 whitespace-pre-line">{invoice.internal_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Invoice not found</p>
          )}
        </SheetContent>
      </Sheet>

      {/* Sub-modals */}
      {invoice && (
        <>
          <SendInvoiceModal
            open={sendModalOpen}
            onOpenChange={setSendModalOpen}
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
            clientEmail={invoice.client?.email || ""}
            clientName={invoice.client ? `${invoice.client.first_name || ""} ${invoice.client.last_name || ""}`.trim() : ""}
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
