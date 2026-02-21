import * as React from "react"
import { cn } from "@/lib/utils"

/* ─── Card ─── */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-card border border-[--af-border-default] bg-[--af-bg-surface] shadow-af-card transition-[box-shadow,border-color]",
          hoverable && "hover:shadow-af-card-hover hover:border-[--af-border-strong]",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

/* ─── CardHeader ─── */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-5 py-4 border-b border-[--af-border-default]",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/* ─── CardBody ─── */
const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-5 py-4", className)} {...props} />
))
CardBody.displayName = "CardBody"

/* ─── CardFooter ─── */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-5 py-3 border-t border-[--af-border-default] flex items-center justify-end gap-2",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardBody, CardFooter }
