"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { CityCombobox } from "@/components/ui/city-combobox"

export interface LeadFormData {
  id?: string
  uniqueCustomerIdentifier: string
  leadTypeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  address: string
  city: string
  state: string
  source: string
  interest: string
  painPoints: string
  budget: string
  squareFootage: string
  costPerSqft: string
  discountType: string
  discountValue: string
  temperature: string
  status: string
  leadScore: string
  nextAction: string
  nextActionDate: string
  notes: string
  assignedTo: string
}

const emptyForm = (): LeadFormData => ({
  uniqueCustomerIdentifier: "",
  leadTypeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  address: "",
  city: "",
  state: "",
  source: "other",
  interest: "",
  painPoints: "",
  budget: "",
  squareFootage: "",
  costPerSqft: "",
  discountType: "",
  discountValue: "",
  temperature: "cold",
  status: "new",
  leadScore: "0",
  nextAction: "",
  nextActionDate: "",
  notes: "",
  assignedTo: "",
})

const sourceOptions = [
  { value: "website_form", label: "Website Form" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "social_media", label: "Social Media" },
  { value: "referral", label: "Referral" },
  { value: "cold_call", label: "Cold Call" },
  { value: "ad", label: "Advertisement" },
  { value: "trade_show", label: "Trade Show" },
  { value: "other", label: "Other" },
]

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
]

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
]

type LeadTypeOption = { id: string; label: string }

interface LeadFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: LeadFormData | null
  onSave: (data: LeadFormData) => Promise<void> | void
  workspaceUsers?: { id: string; email: string; name?: string }[]
  leadTypes?: LeadTypeOption[]
}

export function LeadFormModal({
  open,
  onOpenChange,
  lead,
  onSave,
  workspaceUsers = [],
  leadTypes = [],
}: LeadFormModalProps) {
  const [formData, setFormData] = useState<LeadFormData>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("contact")

  useEffect(() => {
    if (open) {
      setFormData(lead ? { ...lead } : emptyForm())
      setSaveError(null)
      setActiveTab("contact")
    }
  }, [open, lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error: any) {
      setSaveError(error.message || "Failed to save lead")
    } finally {
      setIsSaving(false)
    }
  }

  const update = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead?.id ? "Edit Lead" : "New Lead"}</DialogTitle>
          <DialogDescription>
            {lead?.id ? "Update lead information." : "Add a new lead to your pipeline."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unique Customer ID</label>
                  <Input
                    placeholder="e.g., CUST-001"
                    value={formData.uniqueCustomerIdentifier}
                    onChange={(e) => update("uniqueCustomerIdentifier", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lead Type</label>
                  <Select
                    value={formData.leadTypeId || "_none"}
                    onValueChange={(v) => update("leadTypeId", v === "_none" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select lead type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Select lead type</SelectItem>
                      {leadTypes.map((lt) => (
                        <SelectItem key={lt.id} value={lt.id}>{lt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    placeholder="Smith"
                    value={formData.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  placeholder="Acme Corp"
                  value={formData.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="123 Main St"
                  value={formData.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <CityCombobox
                  value={formData.city}
                  onChange={(v) => update("city", v)}
                  placeholder="Search city..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <SearchableSelect
                  options={US_STATES}
                  value={formData.state}
                  onValueChange={(v) => update("state", v)}
                  placeholder="Select state"
                  searchPlaceholder="Search states..."
                />
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Source</label>
                <Select value={formData.source} onValueChange={(v) => update("source", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service</label>
                <Input
                  placeholder="Custom home design, commercial renovation..."
                  value={formData.interest}
                  onChange={(e) => update("interest", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pain Points</label>
                <Textarea
                  placeholder="What challenges are they facing?"
                  className="min-h-[80px] resize-none"
                  value={formData.painPoints}
                  onChange={(e) => update("painPoints", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget</label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={formData.budget}
                  onChange={(e) => update("budget", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Square Footage</label>
                  <Input
                    type="number"
                    placeholder="2500"
                    value={formData.squareFootage}
                    onChange={(e) => update("squareFootage", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cost per Sq Ft</label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={formData.costPerSqft}
                    onChange={(e) => update("costPerSqft", e.target.value)}
                  />
                </div>
              </div>
              {(() => {
                const sqft = parseFloat(formData.squareFootage)
                const cost = parseFloat(formData.costPerSqft)
                const total = !isNaN(sqft) && !isNaN(cost) && sqft > 0 && cost > 0 ? sqft * cost : null
                const discountType = formData.discountType || null
                const discountVal = parseFloat(formData.discountValue)
                const discount = total != null && discountType && !isNaN(discountVal) && discountVal > 0
                  ? discountType === "percent"
                    ? (total * discountVal) / 100
                    : discountVal
                  : 0
                const finalTotal = total != null ? total - discount : null
                const hasDiscount = discount > 0
                return (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Total Price</span>
                      <span className="text-sm font-medium tabular-nums">
                        {total != null ? `$${total.toLocaleString()}` : "---"}
                        {hasDiscount && (
                          <span className="text-xs text-gray-500 font-normal ml-1">
                            (− {discountType === "percent" ? `${discountVal}%` : `$${discount.toLocaleString()}`})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Discount</span>
                      <Select value={formData.discountType || "_none"} onValueChange={(v) => update("discountType", v === "_none" ? "" : v)}>
                        <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
                          <SelectItem value="percent">Percent</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20 h-9"
                        placeholder={formData.discountType === "percent" ? "10" : "5000"}
                        value={formData.discountValue}
                        onChange={(e) => update("discountValue", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Final Total</span>
                      <span className="text-sm font-semibold tabular-nums">{finalTotal != null ? `$${finalTotal.toLocaleString()}` : "---"}</span>
                    </div>
                  </div>
                )
              })()}
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <div className="flex gap-2">
                  {(["cold", "warm", "hot"] as const).map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => update("temperature", temp)}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium capitalize transition-colors ${
                        formData.temperature === temp
                          ? temp === "cold"
                            ? "border-blue-500 bg-blue-500/10 text-blue-600"
                            : temp === "warm"
                              ? "border-yellow-500 bg-yellow-500/10 text-yellow-600"
                              : "border-red-500 bg-red-500/10 text-red-600"
                          : "border-gray-200 dark:border-gray-800 text-gray-500"
                      }`}
                    >
                      {temp}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Score (0-100)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.leadScore}
                  onChange={(e) => update("leadScore", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Next Action</label>
                  <Input
                    placeholder="Follow up call, send proposal..."
                    value={formData.nextAction}
                    onChange={(e) => update("nextAction", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Next Action Date</label>
                  <Input
                    type="date"
                    value={formData.nextActionDate}
                    onChange={(e) => update("nextActionDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="General notes about this lead..."
                  className="min-h-[100px] resize-none"
                  value={formData.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to Sales Agent</label>
                <Select value={formData.assignedTo} onValueChange={(v) => update("assignedTo", v)}>
                  <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {workspaceUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Assign a team member to manage this lead.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            {saveError && <p className="text-sm text-red-600 flex-1">{saveError}</p>}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : lead?.id ? "Save Changes" : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
