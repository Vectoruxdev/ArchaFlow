"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import { supabase } from "@/lib/supabase/client"
import { ClientSelect } from "@/components/ui/client-select"

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const { currentWorkspace } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loadingInvoice, setLoadingInvoice] = useState(true)
  const [invoiceNumber, setInvoiceNumber] = useState("")

  // Options
  const [projects, setProjects] = useState<any[]>([])

  // Form state
  const [clientValue, setClientValue] = useState<{ clientId: string | null; displayName: string }>({ clientId: null, displayName: "" })
  const [projectId, setProjectId] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [taxRate, setTaxRate] = useState("0")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ])

  useEffect(() => {
    if (currentWorkspace && invoiceId) {
      loadInvoice()
      loadProjects()
    }
  }, [currentWorkspace?.id, invoiceId])

  const loadInvoice = async () => {
    setLoadingInvoice(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`)
      if (!res.ok) {
        toast.error("Invoice not found or access denied")
        router.push("/invoices")
        return
      }
      const data = await res.json()

      if (data.status !== "draft") {
        toast.error("Only draft invoices can be edited")
        router.push("/invoices")
        return
      }

      setInvoiceNumber(data.invoice_number)
      setClientValue({
        clientId: data.client?.id || null,
        displayName: data.client ? `${data.client.first_name || ""} ${data.client.last_name || ""}`.trim() : "",
      })
      setProjectId(data.project_id || "")
      setIssueDate(data.issue_date || "")
      setDueDate(data.due_date || "")
      setPaymentTerms(data.payment_terms || "Net 30")
      setTaxRate(String(data.tax_rate || 0))
      setNotes(data.notes || "")

      if (data.line_items?.length > 0) {
        setLineItems(
          data.line_items.map((item: any) => ({
            description: item.description || "",
            quantity: String(item.quantity || 1),
            unitPrice: String(item.unit_price || 0),
          }))
        )
      }
    } catch {
      toast.error("Failed to load invoice")
      router.push("/invoices")
    } finally {
      setLoadingInvoice(false)
    }
  }

  const loadProjects = async () => {
    if (!currentWorkspace) return
    try {
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .eq("business_id", currentWorkspace.id)
        .order("name", { ascending: true })
      if (data) setProjects(data)
    } catch {}
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: "1", unitPrice: "" }])
  }

  const removeLineItem = (idx: number) => {
    if (lineItems.length === 1) return
    setLineItems(lineItems.filter((_, i) => i !== idx))
  }

  const updateLineItem = (idx: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems]
    updated[idx] = { ...updated[idx], [field]: value }
    setLineItems(updated)
  }

  const getLineAmount = (item: LineItem) => {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + getLineAmount(item), 0)
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100
  const total = subtotal + taxAmount

  const handleSave = async () => {
    if (!currentWorkspace) return

    const validItems = lineItems.filter((item) => item.description.trim() && item.unitPrice)
    if (validItems.length === 0) {
      toast.error("Add at least one line item with a description and price")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientValue.clientId || null,
          projectId: projectId || null,
          lineItems: validItems,
          issueDate,
          dueDate: dueDate || null,
          paymentTerms,
          taxRate: parseFloat(taxRate) || 0,
          notes: notes.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to update invoice")
      }

      toast.success(`Invoice ${invoiceNumber} updated`)
      router.push("/invoices")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loadingInvoice) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => router.push("/invoices")}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 sm:p-10">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">INVOICE</h1>
              <p className="text-sm text-gray-400 mt-1">Editing {invoiceNumber}</p>
            </div>

            {/* From / Bill To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Bill To</p>
                <ClientSelect
                  value={clientValue}
                  onChange={setClientValue}
                  placeholder="Search for a client..."
                />
              </div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Issue Date</label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Due Date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Terms</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 h-9"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Project</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 h-9"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line items */}
            <div className="mb-6">
              <div className="grid grid-cols-[1fr_80px_120px_120px_40px] gap-2 mb-2 px-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Qty</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Price</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Amount</span>
                <span />
              </div>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_80px_120px_120px_40px] gap-2 items-center group">
                    <Input placeholder="Item description" value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)} className="text-sm" />
                    <Input type="number" placeholder="1" value={item.quantity} onChange={(e) => updateLineItem(idx, "quantity", e.target.value)} min="0" step="any" className="text-sm text-right" />
                    <Input type="number" placeholder="0.00" value={item.unitPrice} onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)} min="0" step="0.01" className="text-sm text-right" />
                    <p className="text-sm font-medium text-right text-gray-700 dark:text-gray-300 pr-1">{formatCurrency(getLineAmount(item))}</p>
                    <button onClick={() => removeLineItem(idx)} disabled={lineItems.length === 1} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 disabled:opacity-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addLineItem} className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                <Plus className="w-4 h-4" /> Add line item
              </button>
            </div>

            {/* Totals + Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notes / Payment Instructions</label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 min-h-[100px] resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment instructions, bank details, thank you message..."
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Tax</span>
                    <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-md">
                      <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-16 px-2 py-1 text-sm text-right bg-transparent border-none focus:outline-none" min="0" max="100" step="0.01" />
                      <span className="text-xs text-gray-400 pr-2">%</span>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
