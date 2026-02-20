"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import { supabase } from "@/lib/supabase/client"

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  defaultProjectId?: string
  defaultClientId?: string
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onCreated,
  defaultProjectId,
  defaultClientId,
}: CreateInvoiceModalProps) {
  const { currentWorkspace } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1: Client/Project
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [clientId, setClientId] = useState(defaultClientId || "")
  const [projectId, setProjectId] = useState(defaultProjectId || "")
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Step 2: Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ])

  // Step 3: Dates/terms
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [taxRate, setTaxRate] = useState("0")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open && currentWorkspace) {
      loadOptions()
      // Reset
      setStep(1)
      setLineItems([{ description: "", quantity: "1", unitPrice: "" }])
      setIssueDate(new Date().toISOString().split("T")[0])
      setDueDate("")
      setNotes("")
      setClientId(defaultClientId || "")
      setProjectId(defaultProjectId || "")
    }
  }, [open, currentWorkspace?.id])

  const loadOptions = async () => {
    if (!currentWorkspace) return
    setLoadingOptions(true)
    try {
      const [clientsRes, projectsRes, settingsRes] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("business_id", currentWorkspace.id)
          .order("first_name", { ascending: true }),
        supabase
          .from("projects")
          .select("id, name")
          .eq("business_id", currentWorkspace.id)
          .order("name", { ascending: true }),
        fetch(`/api/invoices/settings?businessId=${currentWorkspace.id}`),
      ])
      if (clientsRes.data) {
        setClients(
          clientsRes.data
            .filter((c: any) => !c.archived_at)
            .map((c: any) => ({
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
              email: c.email,
              name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email || "Unnamed",
            }))
        )
      }
      if (projectsRes.data) setProjects(projectsRes.data)
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setPaymentTerms(settings.default_payment_terms || "Net 30")
        setTaxRate(String(settings.default_tax_rate || 0))
      }
    } catch {
      // Silently continue
    } finally {
      setLoadingOptions(false)
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

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100
  const total = subtotal + taxAmount

  const handleCreate = async () => {
    if (!currentWorkspace) return

    const validItems = lineItems.filter((item) => item.description.trim() && item.unitPrice)
    if (validItems.length === 0) {
      toast.error("Add at least one line item with a description and price")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: currentWorkspace.id,
          clientId: clientId || null,
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
        throw new Error(body.error || "Failed to create invoice")
      }

      const data = await res.json()
      toast.success(`Invoice ${data.invoice_number} created`)
      onOpenChange(false)
      onCreated?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create Invoice {step > 1 && `— Step ${step} of 3`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Select a client and optionally link to a project.</p>

            {loadingOptions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    <option value="">No client selected</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project (optional)</label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)}>Next: Line Items</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Add items to your invoice.</p>

            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                      min="0"
                      step="any"
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium pt-2.5 text-gray-500">
                    ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(idx)}
                    disabled={lineItems.length === 1}
                    className="mt-1"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-3 text-right space-y-1">
              <p className="text-sm text-gray-500">Subtotal: ${subtotal.toFixed(2)}</p>
              {parseFloat(taxRate) > 0 && (
                <p className="text-sm text-gray-500">Tax ({taxRate}%): ${taxAmount.toFixed(2)}</p>
              )}
              <p className="text-base font-semibold">Total: ${total.toFixed(2)}</p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next: Details</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Set dates, terms, and notes.</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Date</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Terms</label>
                <select
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950"
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Rate (%)</label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (visible to client)</label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 min-h-[80px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment instructions, thank you message, etc."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Summary</p>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <p>{lineItems.filter((i) => i.description.trim()).length} line item(s)</p>
                <p>Total: ${total.toFixed(2)}</p>
                {clientId && (
                  <p>Client: {clients.find((c) => c.id === clientId)?.name || "Selected"}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Draft Invoice
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
