import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  viewed: {
    label: "Viewed",
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  signed: {
    label: "Signed",
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  declined: {
    label: "Declined",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  expired: {
    label: "Expired",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
}

export function ContractStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft
  return (
    <Badge className={`${config.className} border`}>
      {config.label}
    </Badge>
  )
}
