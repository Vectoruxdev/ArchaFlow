"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Import,
} from "lucide-react"
import type { ExtractedTask } from "@/lib/integrations/types"

type ScanStatus = "idle" | "fetching" | "extracting" | "ready" | "importing" | "imported" | "error"

interface MessageScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: string
  businessId: string
  providerName: string
}

export function MessageScanDialog({
  open,
  onOpenChange,
  connectionId,
  businessId,
  providerName,
}: MessageScanDialogProps) {
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [tasks, setTasks] = useState<ExtractedTask[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messageCount, setMessageCount] = useState(0)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [importedCount, setImportedCount] = useState(0)

  const selectedTasks = tasks.filter((t) => t.selected)

  async function startScan() {
    setStatus("fetching")
    setErrorMessage("")

    try {
      const res = await fetch("/api/integrations/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, businessId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setErrorMessage(data.error || "Scan failed")
        return
      }

      setSessionId(data.sessionId)
      setMessageCount(data.messageCount)
      setTasks(data.tasks || [])
      setStatus("ready")
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(err.message || "Failed to start scan")
    }
  }

  async function importTasks() {
    if (selectedTasks.length === 0 || !sessionId) return

    setStatus("importing")

    try {
      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          businessId,
          tasks: selectedTasks,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setErrorMessage(data.error || "Import failed")
        return
      }

      setImportedCount(data.imported)
      setStatus("imported")

      // Notify other pages
      window.dispatchEvent(new Event("projectsUpdated"))
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(err.message || "Import failed")
    }
  }

  function toggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, selected: !t.selected } : t
      )
    )
  }

  function updateTaskTitle(taskId: string, title: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title } : t))
    )
  }

  function updateTaskPriority(taskId: string, priority: ExtractedTask["priority"]) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority } : t))
    )
  }

  function updateTaskDueDate(taskId: string, dueDate: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: dueDate || null } : t))
    )
  }

  function handleClose() {
    onOpenChange(false)
    // Reset state after closing animation
    setTimeout(() => {
      setStatus("idle")
      setTasks([])
      setSessionId(null)
      setMessageCount(0)
      setExpandedTask(null)
      setErrorMessage("")
      setImportedCount(0)
    }, 200)
  }

  const priorityColors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Import className="w-5 h-5" />
            Scan {providerName} Messages
          </DialogTitle>
          <DialogDescription>
            {status === "idle" && "Ready to scan selected channels for actionable tasks."}
            {status === "fetching" && "Fetching messages from selected channels..."}
            {status === "extracting" && "AI is analyzing messages for tasks..."}
            {status === "ready" &&
              `Found ${tasks.length} tasks from ${messageCount} messages.`}
            {status === "importing" && "Importing tasks to Inbox project..."}
            {status === "imported" &&
              `Successfully imported ${importedCount} tasks to your Inbox project.`}
            {status === "error" && "Something went wrong."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress states */}
        {(status === "fetching" || status === "extracting" || status === "importing") && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">
              {status === "fetching" && "Fetching messages..."}
              {status === "extracting" && "Extracting tasks with AI..."}
              {status === "importing" && "Importing tasks..."}
            </p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={startScan}>
              Retry Scan
            </Button>
          </div>
        )}

        {/* Imported state */}
        {status === "imported" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {importedCount} tasks imported to your Inbox project.
            </p>
          </div>
        )}

        {/* Task review list */}
        {status === "ready" && (
          <div className="flex-1 overflow-y-auto min-h-0 max-h-[50vh] space-y-2 pr-1">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                No actionable tasks found in the messages.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-3 space-y-2 bg-white dark:bg-gray-950"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.selected}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        value={task.title}
                        onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                        className="h-8 text-sm font-medium"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={task.priority}
                          onValueChange={(v) =>
                            updateTaskPriority(task.id, v as ExtractedTask["priority"])
                          }
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={task.dueDate || ""}
                          onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                          className="h-7 w-36 text-xs"
                        />
                        <Badge
                          className={`text-[10px] ${priorityColors[task.priority] || ""}`}
                        >
                          {Math.round(task.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedTask(expandedTask === task.id ? null : task.id)
                      }
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      {expandedTask === task.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedTask === task.id && (
                    <div className="ml-8 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs space-y-1">
                      {task.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>
                      )}
                      <p className="text-gray-500">
                        <span className="font-medium">From:</span>{" "}
                        #{task.sourceMessage.channelName} by {task.sourceMessage.author}
                      </p>
                      <p className="text-gray-500 italic">
                        &ldquo;{task.sourceMessage.content.slice(0, 300)}
                        {task.sourceMessage.content.length > 300 ? "..." : ""}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={startScan}>Start Scan</Button>
            </>
          )}
          {status === "ready" && tasks.length > 0 && (
            <>
              <div className="flex-1 text-sm text-gray-500">
                {selectedTasks.length} of {tasks.length} tasks selected
              </div>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={importTasks} disabled={selectedTasks.length === 0}>
                Import {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""} to
                Inbox
              </Button>
            </>
          )}
          {(status === "imported" || (status === "ready" && tasks.length === 0)) && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
