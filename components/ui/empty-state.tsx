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
          <Icon className="w-16 h-16 text-gray-400 dark:text-gray-600" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
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
