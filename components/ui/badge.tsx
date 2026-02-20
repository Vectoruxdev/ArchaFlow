import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-badge border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success:
          "border-[--af-success-border] bg-[--af-success-bg] text-[--af-success-text]",
        warning:
          "border-[--af-warning-border] bg-[--af-warning-bg] text-[--af-warning-text]",
        danger:
          "border-[--af-danger-border] bg-[--af-danger-bg] text-[--af-danger-text]",
        info:
          "border-[--af-info-border] bg-[--af-info-bg] text-[--af-info-text]",
        brand:
          "border-[--af-brand-border] bg-[--af-brand-light] text-[--af-brand-text]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
