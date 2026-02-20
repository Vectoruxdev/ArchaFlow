"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Loader2, XCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

interface InvoiceData {
  id: string
  invoiceNumber: string
  status: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  amountPaid: number
  amountDue: number
  issueDate: string
  dueDate: string | null
  paymentTerms: string
  notes: string | null
  client: { id: string; name: string; email: string; company_name: string | null; phone: string | null } | null
  lineItems: { id: string; description: string; quantity: number; unit_price: number; amount: number }[]
  payments: { id: string; amount: number; payment_method: string; payment_date: string }[]
  changeOrders: { id: string; change_order_number: number; title: string; description: string | null; amount: number; status: string; created_at: string }[]
  business: { name: string; address: string; phone: string; email: string; footerText: string }
}

function formatCurrency(val: number): string {
  return `$${parseFloat(String(val)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function PublicInvoicePage() {
  const params = useParams()
  const token = params.token as string

  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInvoice()
  }, [token])

  const loadInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/view?token=${token}`)
      if (!res.ok) {
        const body = await res.json()
        setError(body.error || "Invoice not found")
        return
      }
      setInvoice(await res.json())
    } catch {
      setError("Failed to load invoice")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Unable to Load Invoice</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!invoice) return null

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: Clock },
    sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Clock },
    viewed: { label: "Viewed", color: "bg-blue-100 text-blue-700", icon: Clock },
    partially_paid: { label: "Partially Paid", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
    paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertTriangle },
    void: { label: "Void", color: "bg-gray-100 text-gray-500", icon: XCircle },
  }

  const sc = statusConfig[invoice.status] || statusConfig.sent

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rotate-45" />
            </div>
            <span className="font-semibold text-sm">ArchaFlow</span>
          </div>
          <button
            onClick={() => window.print()}
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 print:py-0 print:px-0">
        {/* Invoice Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6 shadow-sm print:shadow-none print:border-none">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h1>
              <p className="text-lg font-medium text-gray-700">{invoice.invoiceNumber}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${sc.color} print:hidden`}>
              {sc.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* From */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">From</p>
              <p className="font-semibold text-gray-900">{invoice.business.name}</p>
              {invoice.business.address && (
                <p className="text-sm text-gray-500 whitespace-pre-line">{invoice.business.address}</p>
              )}
              {invoice.business.phone && (
                <p className="text-sm text-gray-500">{invoice.business.phone}</p>
              )}
              {invoice.business.email && (
                <p className="text-sm text-gray-500">{invoice.business.email}</p>
              )}
            </div>

            {/* To */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
              {invoice.client ? (
                <>
                  <p className="font-semibold text-gray-900">{invoice.client.name}</p>
                  {invoice.client.company_name && (
                    <p className="text-sm text-gray-500">{invoice.client.company_name}</p>
                  )}
                  {invoice.client.email && (
                    <p className="text-sm text-gray-500">{invoice.client.email}</p>
                  )}
                  {invoice.client.phone && (
                    <p className="text-sm text-gray-500">{invoice.client.phone}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">No client specified</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
            <div>
              <p className="text-gray-400 font-medium">Issue Date</p>
              <p className="text-gray-900">{invoice.issueDate ? formatDate(invoice.issueDate) : "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Due Date</p>
              <p className="text-gray-900">{invoice.dueDate ? formatDate(invoice.dueDate) : "Upon receipt"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Payment Terms</p>
              <p className="text-gray-900">{invoice.paymentTerms || "—"}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({invoice.taxRate}%)</span>
                  <span className="text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid</span>
                  <span>-{formatCurrency(invoice.amountPaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-900 pt-2">
                <span>Balance Due</span>
                <span>{formatCurrency(Math.max(0, invoice.amountDue))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payments */}
        {invoice.payments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm print:shadow-none print:border-none">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payments Received</h3>
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {formatDate(p.payment_date)} — {p.payment_method.replace("_", " ")}
                  </span>
                  <span className="text-green-600 font-medium">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Orders */}
        {invoice.changeOrders.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm print:shadow-none print:border-none">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Approved Change Orders</h3>
            <div className="space-y-2">
              {invoice.changeOrders.map((co) => (
                <div key={co.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    CO #{co.change_order_number}: {co.title}
                  </span>
                  <span className={`font-medium ${co.amount >= 0 ? "text-gray-900" : "text-green-600"}`}>
                    {co.amount >= 0 ? "+" : ""}{formatCurrency(co.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm print:shadow-none print:border-none">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        {invoice.business.footerText && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm print:shadow-none print:border-none">
            <p className="text-sm text-gray-500 whitespace-pre-line">{invoice.business.footerText}</p>
          </div>
        )}

        <div className="border-t border-gray-200 mt-8 py-6 text-center print:hidden">
          <p className="text-xs text-gray-400">
            Powered by ArchaFlow · Project management for architecture firms
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
        }
      `}</style>
    </div>
  )
}
