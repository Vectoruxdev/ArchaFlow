"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Download, Eye, Plus } from "lucide-react"

interface Invoice {
  id: string
  number: string
  date: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue"
  dueDate: string
}

interface InvoiceTableProps {
  invoices: Invoice[]
  onGenerateInvoice?: (amount: number, dueDate: string) => void
}

export function InvoiceTable({ invoices, onGenerateInvoice }: InvoiceTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")

  const statusColors = {
    draft: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    sent: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    paid: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    overdue: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount && dueDate && onGenerateInvoice) {
      onGenerateInvoice(parseFloat(amount), dueDate)
      setIsModalOpen(false)
      setAmount("")
      setDueDate("")
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invoices</h3>
          <p className="text-sm text-gray-500">
            Total: ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Invoice
        </Button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-4 py-3 text-sm font-medium">{invoice.number}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${statusColors[invoice.status]}`}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for this project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Generate Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
