import { Badge } from "@/components/ui/badge"

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-[--af-bg-canvas]0/10 text-[--af-text-secondary] border-[--af-border-default]",
  },
  sent: {
    label: "Sent",
    className: "bg-[--af-info-bg]0/10 text-[--af-info-text] border-[--af-info-border]/20",
  },
  viewed: {
    label: "Viewed",
    className: "bg-[--af-warning-bg]0/10 text-[--af-warning-text] border-[--af-warning-border]/20",
  },
  signed: {
    label: "Signed",
    className: "bg-[--af-success-bg]0/10 text-[--af-success-text] border-[--af-success-border]/20",
  },
  declined: {
    label: "Declined",
    className: "bg-[--af-danger-bg]0/10 text-[--af-danger-text] border-[--af-danger-border]/20",
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
