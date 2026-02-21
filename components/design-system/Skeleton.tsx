import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: "none" | "sm" | "md" | "lg" | "full"
}

const roundedMap = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ width, height, rounded = "md", className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[--af-bg-surface-alt] animate-[af-skeleton_1.5s_ease-in-out_infinite]",
          roundedMap[rounded],
          className
        )}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
