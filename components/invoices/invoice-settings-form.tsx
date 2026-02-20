"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"

export function InvoiceSettingsForm() {
  const { currentWorkspace } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("Net 30")
  const [defaultTaxRate, setDefaultTaxRate] = useState("0")
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [footerText, setFooterText] = useState("")

  useEffect(() => {
    if (currentWorkspace) loadSettings()
  }, [currentWorkspace?.id])

  const loadSettings = async () => {
    if (!currentWorkspace) return
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/settings?businessId=${currentWorkspace.id}`)
      if (res.ok) {
        const data = await res.json()
        setDefaultPaymentTerms(data.default_payment_terms || "Net 30")
        setDefaultTaxRate(String(data.default_tax_rate || 0))
        setCompanyName(data.company_name || "")
        setCompanyAddress(data.company_address || "")
        setCompanyPhone(data.company_phone || "")
        setCompanyEmail(data.company_email || "")
        setFooterText(data.footer_text || "")
      }
    } catch {
      toast.error("Failed to load invoice settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentWorkspace) return
    setSaving(true)
    try {
      const res = await fetch("/api/invoices/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: currentWorkspace.id,
          default_payment_terms: defaultPaymentTerms,
          default_tax_rate: parseFloat(defaultTaxRate) || 0,
          company_name: companyName.trim() || null,
          company_address: companyAddress.trim() || null,
          company_phone: companyPhone.trim() || null,
          company_email: companyEmail.trim() || null,
          footer_text: footerText.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to save")
      }

      toast.success("Invoice settings saved")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-semibold mb-1">Invoice Settings</h3>
        <p className="text-sm text-gray-500">
          Configure defaults for new invoices and your company information displayed on invoices.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Defaults</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Terms</label>
            <select
              className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950"
              value={defaultPaymentTerms}
              onChange={(e) => setDefaultPaymentTerms(e.target.value)}
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Tax Rate (%)</label>
            <Input
              type="number"
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(e.target.value)}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Company Information</h4>
        <p className="text-xs text-gray-500">Displayed on invoices under "From"</p>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 min-h-[80px] resize-y"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="123 Main St&#10;City, State ZIP"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="billing@company.com"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Invoice Footer</label>
        <textarea
          className="w-full border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 min-h-[80px] resize-y"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          placeholder="Payment instructions, bank details, late fee policy, etc."
        />
        <p className="text-xs text-gray-500">Shown at the bottom of invoices</p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Settings
      </Button>
    </div>
  )
}
