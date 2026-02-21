import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const headingVariants = cva("font-display font-bold tracking-tight", {
  variants: {
    size: {
      sm: "text-[18px] leading-snug",
      md: "text-[20px] leading-snug",
      lg: "text-[24px] leading-snug",
      xl: "text-[28px] leading-tight",
      "2xl": "text-[32px] leading-tight",
    },
  },
  defaultVariants: {
    size: "lg",
  },
})

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingElement
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Tag = "h2", size, className, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(
          headingVariants({ size }),
          "text-[--af-text-primary]",
          className
        )}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading, headingVariants }
