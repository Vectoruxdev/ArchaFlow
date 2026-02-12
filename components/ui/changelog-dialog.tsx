"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CHANGELOG } from "@/lib/app-version"

interface ChangelogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-md">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] space-y-4 pr-2">
          {CHANGELOG.map((entry) => (
            <div
              key={entry.version}
              className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {entry.version}
                </Badge>
                <span className="text-sm text-gray-500">{entry.date}</span>
              </div>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                {entry.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
