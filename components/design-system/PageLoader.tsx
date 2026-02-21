import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./Spinner"
import { Text } from "./Text"

export interface PageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

const PageLoader = React.forwardRef<HTMLDivElement, PageLoaderProps>(
  ({ message = "Loading...", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center min-h-[60vh] gap-4",
          className
        )}
        {...props}
      >
        <Spinner size="lg" />
        {message && (
          <Text size="sm" color="muted">
            {message}
          </Text>
        )}
      </div>
    )
  }
)
PageLoader.displayName = "PageLoader"

export { PageLoader }
