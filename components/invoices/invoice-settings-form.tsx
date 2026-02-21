"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { CreditCard, ExternalLink, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/design-system"
import { toast } from "@/lib/toast"
import { useAuth } from "@/lib/auth/auth-context"

interface ConnectStatus {
  connected: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  onboardingComplete: boolean
  paymentsEnabled: boolean
}

export function InvoiceSettingsForm() {
  const { currentWorkspace } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)

  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("Net 30")
  const [defaultTaxRate, setDefaultTaxRate] = useState("0")
  const [companyName, setCompanyName] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [footerText, setFooterText] = useState("")

  useEffect(() => {
    if (currentWorkspace) {
      loadSettings()
      loadConnectStatus()
    }
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

  const loadConnectStatus = async () => {
    if (!currentWorkspace) return
    try {
      const res = await fetch(`/api/stripe/connect/status?businessId=${currentWorkspace.id}`)
      if (res.ok) {
        setConnectStatus(await res.json())
      }
    } catch {
      // Non-critical
    }
  }

  const handleConnectStripe = async () => {
    if (!currentWorkspace) return
    setConnectLoading(true)
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: currentWorkspace.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message)
      setConnectLoading(false)
    }
  }

  const handleTogglePayments = async () => {
    if (!currentWorkspace) return
    setToggleLoading(true)
    try {
      const res = await fetch("/api/stripe/connect/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: currentWorkspace.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConnectStatus((prev) => prev ? { ...prev, paymentsEnabled: data.enabled } : prev)
      toast.success(data.enabled ? "Online payments enabled" : "Online payments disabled")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setToggleLoading(false)
    }
  }

  const handleOpenDashboard = async () => {
    if (!currentWorkspace) return
    try {
      const res = await fetch("/api/stripe/connect/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: currentWorkspace.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.open(data.url, "_blank")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const isFreeTier = currentWorkspace?.planTier === "free"

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-display font-bold mb-1">Invoice Settings</h3>
        <p className="text-sm text-[--af-text-muted]">
          Configure defaults for new invoices and your company information displayed on invoices.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">Defaults</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Terms</label>
            <select
              className="w-full h-9 rounded-[--af-radius-input] border border-[--af-border-default] bg-[--af-bg-input] px-3 text-[13px] transition-colors"
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
        <h4 className="text-sm font-medium text-foreground">Company Information</h4>
        <p className="text-xs text-[--af-text-muted]">Displayed on invoices under "From"</p>

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
              className="w-full h-9 rounded-[--af-radius-input] border border-[--af-border-default] bg-[--af-bg-input] px-3 text-[13px] transition-colors min-h-[80px] resize-y"
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
          className="w-full h-9 rounded-[--af-radius-input] border border-[--af-border-default] bg-[--af-bg-input] px-3 text-[13px] transition-colors min-h-[80px] resize-y"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          placeholder="Payment instructions, bank details, late fee policy, etc."
        />
        <p className="text-xs text-[--af-text-muted]">Shown at the bottom of invoices</p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Spinner size="sm" className="mr-2" />}
        Save Settings
      </Button>

      {/* Online Payments Section */}
      <div className="border-t border-[--af-border-default] pt-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-[--af-text-secondary] dark:text-[--af-text-muted]" />
          <h3 className="text-lg font-display font-bold">Online Payments</h3>
        </div>
        <p className="text-sm text-[--af-text-muted] mb-4">
          Let clients pay invoices with a credit card directly from their invoice link.
        </p>

        {isFreeTier ? (
          <div className="flex items-start gap-3 bg-[--af-bg-surface-alt] rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-[--af-text-muted] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[--af-text-secondary] dark:text-[--af-text-muted]">
                Upgrade to Pro to accept online payments
              </p>
              <p className="text-xs text-[--af-text-muted] mt-1">
                Online payments are available on Pro and Enterprise plans.
              </p>
            </div>
          </div>
        ) : !connectStatus?.connected ? (
          <div className="space-y-3">
            <p className="text-sm text-[--af-text-secondary]">
              Connect your Stripe account to start accepting credit card payments on invoices. A $0.50 platform fee applies per transaction.
            </p>
            <Button onClick={handleConnectStripe} disabled={connectLoading}>
              {connectLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Connect Stripe Account
            </Button>
          </div>
        ) : !connectStatus.onboardingComplete ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-[--af-warning-bg] rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-[--af-warning-text] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[--af-warning-text]">
                  Stripe setup incomplete
                </p>
                <p className="text-xs text-[--af-warning-text] mt-1">
                  Complete your Stripe onboarding to start accepting payments.
                </p>
              </div>
            </div>
            <Button onClick={handleConnectStripe} disabled={connectLoading}>
              {connectLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Complete Setup
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Accept online payments
                </p>
                <p className="text-xs text-[--af-text-muted]">
                  Clients will see a "Pay Now" button on their invoices
                </p>
              </div>
              <Switch
                checked={connectStatus.paymentsEnabled}
                onCheckedChange={handleTogglePayments}
                disabled={toggleLoading}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenDashboard}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Payouts
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
