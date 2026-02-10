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

export interface LeadFormData {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  jobTitle: string
  address: string
  source: string
  interest: string
  painPoints: string
  budgetMin: string
  budgetMax: string
  industry: string
  companySize: string
  location: string
  temperature: string
  status: string
  leadScore: string
  nextAction: string
  nextActionDate: string
  notes: string
  assignedTo: string
}

const emptyForm = (): LeadFormData => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  jobTitle: "",
  address: "",
  source: "other",
  interest: "",
  painPoints: "",
  budgetMin: "",
  budgetMax: "",
  industry: "",
  companySize: "",
  location: "",
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

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
]

const companySizeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1001+", label: "1,001+ employees" },
]

interface LeadFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: LeadFormData | null
  onSave: (data: LeadFormData) => Promise<void> | void
  workspaceUsers?: { id: string; email: string; name?: string }[]
}

export function LeadFormModal({
  open,
  onOpenChange,
  lead,
  onSave,
  workspaceUsers = [],
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    placeholder="Acme Corp"
                    value={formData.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    placeholder="CEO"
                    value={formData.jobTitle}
                    onChange={(e) => update("jobTitle", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={(e) => update("address", e.target.value)}
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
                <label className="text-sm font-medium">Interest / Service</label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Min ($)</label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={formData.budgetMin}
                    onChange={(e) => update("budgetMin", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Max ($)</label>
                  <Input
                    type="number"
                    placeholder="200000"
                    value={formData.budgetMax}
                    onChange={(e) => update("budgetMax", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Input
                    placeholder="Real Estate, Construction..."
                    value={formData.industry}
                    onChange={(e) => update("industry", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Size</label>
                  <Select value={formData.companySize} onValueChange={(v) => update("companySize", v)}>
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      {companySizeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="City, State or Region"
                  value={formData.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </div>
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
