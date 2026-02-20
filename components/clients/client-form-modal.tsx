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
import { Plus, Trash2 } from "lucide-react"

// Database-aligned client type
export interface ClientFormData {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  description: string
  contacts: SubContact[]
}

export interface SubContact {
  id?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  description: string
}

const emptyContact = (): SubContact => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  description: "",
})

const emptyForm = (): ClientFormData => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  description: "",
  contacts: [],
})

interface ClientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: ClientFormData | null
  onSave: (client: ClientFormData) => Promise<void> | void
}

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSave,
}: ClientFormModalProps) {
  const [formData, setFormData] = useState<ClientFormData>(emptyForm())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({
          id: client.id,
          firstName: client.firstName || "",
          lastName: client.lastName || "",
          email: client.email || "",
          phone: client.phone || "",
          address: client.address || "",
          description: client.description || "",
          contacts: client.contacts?.length
            ? client.contacts.map((c) => ({ ...c }))
            : [],
        })
      } else {
        setFormData(emptyForm())
      }
      setSaveError(null)
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)

    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving client:", error)
      setSaveError(error.message || "Failed to save client")
    } finally {
      setIsSaving(false)
    }
  }

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, emptyContact()],
    }))
  }

  const removeContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }))
  }

  const updateContact = (index: number, field: keyof SubContact, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "New Client"}</DialogTitle>
          <DialogDescription>
            {client
              ? "Update client information and contacts."
              : "Add a new client to your workspace."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                placeholder="123 Main St, City, State"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Additional information about the client..."
                className="min-h-[80px] resize-none"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          {/* Sub-Contacts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Contacts</h3>
                <p className="text-xs text-[--af-text-muted]">
                  Add people associated with this client (spouse, project manager, etc.)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </Button>
            </div>

            {formData.contacts.length === 0 && (
              <p className="text-sm text-[--af-text-muted] italic py-2">
                No additional contacts added yet.
              </p>
            )}

            {formData.contacts.map((contact, index) => (
              <div
                key={index}
                className="border border-[--af-border-default] rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[--af-text-secondary]">
                    Contact {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContact(index)}
                    className="text-[--af-danger-text] hover:text-[--af-danger-text] hover:bg-[--af-danger-bg]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">First Name *</label>
                    <Input
                      placeholder="First name"
                      value={contact.firstName}
                      onChange={(e) =>
                        updateContact(index, "firstName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Last Name *</label>
                    <Input
                      placeholder="Last name"
                      value={contact.lastName}
                      onChange={(e) =>
                        updateContact(index, "lastName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Role</label>
                    <Input
                      placeholder="e.g., Spouse, GM"
                      value={contact.role}
                      onChange={(e) =>
                        updateContact(index, "role", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={contact.email}
                      onChange={(e) =>
                        updateContact(index, "email", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Phone</label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={contact.phone}
                      onChange={(e) =>
                        updateContact(index, "phone", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <DialogFooter>
            {saveError && (
              <p className="text-sm text-[--af-danger-text] flex-1">{saveError}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : client
                  ? "Save Changes"
                  : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
