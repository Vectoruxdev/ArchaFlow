"use client"

import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpgradePromptProps {
  feature: string
  requiredPlan?: "pro" | "enterprise"
  className?: string
}

export function UpgradePrompt({
  feature,
  requiredPlan = "pro",
  className = "",
}: UpgradePromptProps) {
  const planName = requiredPlan === "enterprise" ? "Enterprise" : "Pro"

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6 text-center ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
        <Lock className="w-5 h-5 text-gray-500" />
      </div>
      <div>
        <p className="font-medium text-sm">
          {feature} requires the {planName} plan
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Upgrade to unlock this feature and more.
        </p>
      </div>
      <Button asChild size="sm" className="mt-1">
        <Link href="/settings/billing">
          Upgrade to {planName}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </Button>
    </div>
  )
}
