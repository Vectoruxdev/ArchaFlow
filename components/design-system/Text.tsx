import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-[11px]",
      sm: "text-[13px]",
      md: "text-[14px]",
      lg: "text-[16px]",
    },
    color: {
      primary: "text-[--af-text-primary]",
      secondary: "text-[--af-text-secondary]",
      muted: "text-[--af-text-muted]",
      success: "text-[--af-success-text]",
      warning: "text-[--af-warning-text]",
      danger: "text-[--af-danger-text]",
      brand: "text-[--af-brand-text]",
      info: "text-[--af-info-text]",
      inherit: "text-inherit",
    },
    weight: {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    size: "sm",
    color: "secondary",
    weight: "normal",
  },
})

type TextElement = "p" | "span" | "small" | "label"

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: TextElement
  mono?: boolean
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as: Tag = "p", size, color, weight, mono, className, ...props }, ref) => {
    return (
      <Tag
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={cn(
          textVariants({ size, color, weight }),
          mono && "font-mono",
          className
        )}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }
