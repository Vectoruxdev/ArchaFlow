"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Loader2, XCircle, CheckCircle2, Clock, AlertTriangle, CreditCard } from "lucide-react"
import { StripePaymentForm } from "@/components/invoices/stripe-payment-form"

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
  client: { id: string; first_name: string; last_name: string; email: string; phone: string | null } | null
  lineItems: { id: string; description: string; quantity: number; unit_price: number; amount: number }[]
  payments: { id: string; amount: number; payment_method: string; payment_date: string }[]
  changeOrders: { id: string; change_order_number: number; title: string; description: string | null; amount: number; status: string; created_at: string }[]
  business: { name: string; address: string; phone: string; email: string; footerText: string }
  onlinePaymentsEnabled?: boolean
}

function formatCurrency(val: number): string {
  return `$${parseFloat(String(val)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function PublicInvoicePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string

  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [payAmount, setPayAmount] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    loadInvoice()
  }, [token])

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true)
    }
  }, [searchParams])

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

  const isPayable = invoice &&
    invoice.onlinePaymentsEnabled &&
    invoice.amountDue > 0 &&
    ["sent", "viewed", "overdue", "partially_paid"].includes(invoice.status)

  const handleStartPayment = () => {
    if (!invoice) return
    setPayAmount(String(invoice.amountDue))
    setShowPayment(true)
    setClientSecret(null)
    setPaymentError(null)
  }

  const handleCreatePaymentIntent = async () => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0 || (invoice && amount > invoice.amountDue)) {
      setPaymentError(`Enter an amount between $0.01 and $${invoice?.amountDue.toFixed(2)}`)
      return
    }

    setPaymentLoading(true)
    setPaymentError(null)
    try {
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setClientSecret(data.clientSecret)
    } catch (err: any) {
      setPaymentError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    setShowPayment(false)
    setClientSecret(null)
    // Reload invoice to show updated payment status
    loadInvoice()
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

      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="max-w-4xl mx-auto px-4 mt-6 print:hidden">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Payment successful!</p>
              <p className="text-xs text-green-600">Your payment has been received and is being processed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pay Now Bar */}
      {isPayable && !showPayment && !paymentSuccess && (
        <div className="max-w-4xl mx-auto px-4 mt-6 print:hidden">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Balance Due: {formatCurrency(invoice.amountDue)}</p>
              <p className="text-xs text-gray-500">Pay securely with a credit or debit card</p>
            </div>
            <button
              onClick={handleStartPayment}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {showPayment && (
        <div className="max-w-4xl mx-auto px-4 mt-6 print:hidden">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pay Invoice {invoice?.invoiceNumber}</h3>
              <button
                onClick={() => { setShowPayment(false); setClientSecret(null); setPaymentError(null) }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>

            {!clientSecret ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      min="0.01"
                      max={invoice?.amountDue}
                      step="0.01"
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Balance due: {formatCurrency(invoice?.amountDue || 0)}. You can pay the full amount or a partial payment.
                  </p>
                </div>
                {paymentError && (
                  <p className="text-sm text-red-600">{paymentError}</p>
                )}
                <button
                  onClick={handleCreatePaymentIntent}
                  disabled={paymentLoading}
                  className="flex items-center justify-center gap-2 w-full bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {paymentLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Continue to Payment
                </button>
              </div>
            ) : (
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={parseFloat(payAmount)}
                invoiceNumber={invoice?.invoiceNumber || ""}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => setPaymentError(msg)}
              />
            )}
            {paymentError && clientSecret && (
              <p className="text-sm text-red-600 mt-3">{paymentError}</p>
            )}
          </div>
        </div>
      )}

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
                  <p className="font-semibold text-gray-900">{`${invoice.client.first_name || ""} ${invoice.client.last_name || ""}`.trim()}</p>
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
