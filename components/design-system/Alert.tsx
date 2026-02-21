import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative flex items-start gap-3 rounded-[--af-radius-card] border px-4 py-3 text-[13px]",
  {
    variants: {
      variant: {
        info: "bg-[--af-info-bg] border-[--af-info-border] text-[--af-info-text]",
        success: "bg-[--af-success-bg] border-[--af-success-border] text-[--af-success-text]",
        warning: "bg-[--af-warning-bg] border-[--af-warning-border] text-[--af-warning-text]",
        error: "bg-[--af-danger-bg] border-[--af-danger-border] text-[--af-danger-text]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = "info", title, dismissible, onDismiss, className, children, ...props }, ref) => {
    const Icon = iconMap[variant ?? "info"]

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold mb-0.5">{title}</p>}
          <div className="leading-relaxed">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

export { Alert, alertVariants }
