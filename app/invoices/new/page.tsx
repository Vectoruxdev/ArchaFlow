"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Trash2, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import { supabase } from "@/lib/supabase/client"
import { ClientSelect } from "@/components/ui/client-select"
import { ProjectSelect } from "@/components/ui/project-select"

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { currentWorkspace } = useAuth()
  const [saving, setSaving] = useState(false)
  const [savingAndSending, setSavingAndSending] = useState(false)

  // Options
  const [settings, setSettings] = useState<any>(null)

  // Pre-fill from query params (e.g. from project detail "Generate Invoice" button)
  const [clientValue, setClientValue] = useState<{ clientId: string | null; displayName: string }>({ clientId: null, displayName: "" })
  const [projectValue, setProjectValue] = useState<{ projectId: string | null; displayName: string }>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const id = params.get("projectId")
      const name = params.get("projectName")
      if (id) return { projectId: id, displayName: name || "" }
    }
    return { projectId: null, displayName: "" }
  })
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [taxRate, setTaxRate] = useState("0")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ])

  useEffect(() => {
    if (currentWorkspace) loadOptions()
  }, [currentWorkspace?.id])

  // Auto-calculate due date from payment terms
  useEffect(() => {
    if (!issueDate) return
    const days = paymentTerms === "Due on Receipt" ? 0
      : paymentTerms === "Net 15" ? 15
      : paymentTerms === "Net 30" ? 30
      : paymentTerms === "Net 45" ? 45
      : paymentTerms === "Net 60" ? 60
      : 30
    const due = new Date(issueDate)
    due.setDate(due.getDate() + days)
    setDueDate(due.toISOString().split("T")[0])
  }, [issueDate, paymentTerms])

  const loadOptions = async () => {
    if (!currentWorkspace) return
    try {
      // Load invoice settings
      const settingsRes = await fetch(`/api/invoices/settings?businessId=${currentWorkspace.id}`)
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setSettings(s)
        setPaymentTerms(s.default_payment_terms || "Net 30")
        setTaxRate(String(s.default_tax_rate || 0))
      }
    } catch (err) {
      console.error("Settings fetch error:", err)
    }
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

  const handleSave = async (andSend = false) => {
    if (!currentWorkspace) return

    const validItems = lineItems.filter((item) => item.description.trim() && item.unitPrice)
    if (validItems.length === 0) {
      toast.error("Add at least one line item with a description and price")
      return
    }

    andSend ? setSavingAndSending(true) : setSaving(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: currentWorkspace.id,
          clientId: clientValue.clientId || null,
          projectId: projectValue.projectId || null,
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
        throw new Error(body.error || "Failed to create invoice")
      }

      const data = await res.json()

      if (andSend) {
        // Send immediately
        const sendRes = await fetch(`/api/invoices/${data.id}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientName: clientValue.displayName || "",
          }),
        })
        if (sendRes.ok) {
          const sendData = await sendRes.json()
          if (sendData.emailWarning) {
            toast.warning(`Invoice created but email failed: ${sendData.emailWarning}`)
          } else {
            toast.success(`Invoice ${data.invoice_number} created and sent`)
          }
        } else {
          toast.success(`Invoice ${data.invoice_number} created (send failed — you can resend later)`)
        }
      } else {
        toast.success(`Invoice ${data.invoice_number} saved as draft`)
      }

      router.push("/invoices")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
      setSavingAndSending(false)
    }
  }

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <AppLayout>
      <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-950">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[--af-bg-surface] border-b border-[--af-border-default]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => router.push("/invoices")}
              className="flex items-center gap-2 text-sm text-[--af-text-secondary] hover:text-foreground dark:hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Invoices
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving || savingAndSending}
              >
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Save Draft
              </Button>
              {clientValue.clientId && (
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving || savingAndSending}
                >
                  {savingAndSending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  <Send className="w-4 h-4 mr-1" />
                  Save & Send
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-[--af-bg-surface] dark:bg-warm-900 border border-[--af-border-default] rounded-xl shadow-sm p-6 sm:p-10">

            {/* Header: Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">INVOICE</h1>
              <p className="text-sm text-[--af-text-muted] mt-1">New draft — number assigned on save</p>
            </div>

            {/* From / Bill To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              {/* From */}
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted] mb-3">From</p>
                {settings?.company_name ? (
                  <div className="text-sm space-y-0.5">
                    <p className="font-semibold text-foreground">{settings.company_name}</p>
                    {settings.company_address && (
                      <p className="text-[--af-text-muted] whitespace-pre-line">{settings.company_address}</p>
                    )}
                    {settings.company_phone && <p className="text-[--af-text-muted]">{settings.company_phone}</p>}
                    {settings.company_email && <p className="text-[--af-text-muted]">{settings.company_email}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-[--af-text-muted]">
                    Set up your company info in{" "}
                    <button
                      onClick={() => router.push("/invoices")}
                      className="text-[--af-info-text] hover:underline"
                    >
                      Invoice Settings
                    </button>
                  </p>
                )}
              </div>

              {/* Bill To */}
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted] mb-3">Bill To</p>
                <ClientSelect
                  value={clientValue}
                  onChange={setClientValue}
                  placeholder="Search for a client..."
                />
              </div>
            </div>

            {/* Meta row: dates, terms, project */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 pb-8 border-b border-[--af-border-default]/50 dark:border-warm-800">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Issue Date</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Terms</label>
                <select
                  className="w-full h-9 rounded-[--af-radius-input] border border-[--af-border-default] bg-[--af-bg-input] px-3 text-[13px] transition-colors"
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
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Project</label>
                <ProjectSelect
                  value={projectValue}
                  onChange={setProjectValue}
                  placeholder="Search for a project..."
                />
              </div>
            </div>

            {/* Line items */}
            <div className="mb-6">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_80px_120px_120px_40px] gap-2 mb-2 px-1">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Description</span>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted] text-right">Qty</span>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted] text-right">Price</span>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted] text-right">Amount</span>
                <span />
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_80px_120px_120px_40px] gap-2 items-center group"
                  >
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                      min="0"
                      step="any"
                      className="text-sm text-right"
                    />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                      min="0"
                      step="0.01"
                      className="text-sm text-right"
                    />
                    <p className="text-sm font-medium text-right text-[--af-text-secondary] dark:text-[--af-text-muted] pr-1">
                      {formatCurrency(getLineAmount(item))}
                    </p>
                    <button
                      onClick={() => removeLineItem(idx)}
                      disabled={lineItems.length === 1}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[--af-text-muted] hover:text-[--af-danger-text] disabled:opacity-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={addLineItem}
                className="mt-3 flex items-center gap-1 text-sm text-[--af-info-text] hover:text-[--af-info-text] font-medium"
              >
                <Plus className="w-4 h-4" /> Add line item
              </button>
            </div>

            {/* Totals + Notes side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-[--af-border-default]/50 dark:border-warm-800">
              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[--af-text-muted]">Notes / Payment Instructions</label>
                <textarea
                  className="w-full h-9 rounded-[--af-radius-input] border border-[--af-border-default] bg-[--af-bg-input] px-3 text-[13px] transition-colors min-h-[100px] resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment instructions, bank details, thank you message..."
                />
              </div>

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[--af-text-muted]">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[--af-text-muted]">Tax</span>
                    <div className="flex items-center border border-[--af-border-default] rounded-md">
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-16 px-2 py-1 text-sm text-right bg-transparent border-none focus:outline-none"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="text-xs text-[--af-text-muted] pr-2">%</span>
                    </div>
                  </div>
                  <span className="font-medium text-foreground">{formatCurrency(taxAmount)}</span>
                </div>

                <div className="flex justify-between text-lg font-bold pt-3 border-t border-[--af-border-default]">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom actions (mobile-friendly) */}
          <div className="flex items-center justify-end gap-2 mt-6 pb-8 sm:hidden">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving || savingAndSending}
            >
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Draft
            </Button>
            {clientValue.clientId && (
              <Button
                onClick={() => handleSave(true)}
                disabled={saving || savingAndSending}
              >
                {savingAndSending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Save & Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
