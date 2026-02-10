"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText } from "lucide-react"

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice when you're ready to bill a client"
          action={{
            label: "Create Invoice",
            onClick: () => {
              // TODO: Open invoice creation modal
              console.log("Create invoice clicked")
            },
          }}
        />
      </div>
    </DashboardLayout>
  )
}
