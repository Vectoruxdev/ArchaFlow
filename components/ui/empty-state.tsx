import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex flex-col items-center max-w-md text-center">
        <div className="mb-6">
          <Icon className="w-16 h-16 text-[--af-text-muted]" />
        </div>

        <h3 className="text-xl font-display font-bold mb-2 text-foreground">
          {title}
        </h3>

        <p className="text-[13px] text-[--af-text-secondary] mb-6">
          {description}
        </p>

        {action && (
          <Button onClick={action.onClick} size="default">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
