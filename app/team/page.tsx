"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { UsersRound, Plus } from "lucide-react"

export default function TeamPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersRound className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Team Members Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Invite team members to collaborate on projects and manage workload together.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite Team Member
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
