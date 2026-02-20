"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SendInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  invoiceNumber: string
  clientEmail: string
  clientName: string
  onSent?: () => void
}

export function SendInvoiceModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  clientEmail,
  clientName,
  onSent,
}: SendInvoiceModalProps) {
  const [email, setEmail] = useState(clientEmail)
  const [recipientName, setRecipientName] = useState(clientName)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error("Recipient email is required")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), recipientName: recipientName.trim() }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to send invoice")
      }

      const data = await res.json()
      if (data.emailWarning) {
        toast.warning(`Invoice sent but email failed: ${data.emailWarning}`)
      } else {
        toast.success(`Invoice ${invoiceNumber} sent to ${email}`)
      }
      onOpenChange(false)
      onSent?.()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Send this invoice via email. The client will receive a link to view the invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Name</label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Client name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
