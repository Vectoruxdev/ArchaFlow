"use client"

import { useState, useEffect } from "react"
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
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Import,
  Inbox,
  FolderPlus,
  User,
  Calendar,
  Filter,
} from "lucide-react"
import { Spinner } from "@/components/design-system"
import type { ExtractedTask } from "@/lib/integrations/types"

type ScanStatus = "idle" | "fetching" | "extracting" | "ready" | "importing" | "imported" | "error"
type ImportDestination = "inbox" | "new_project"
type DateRange = "today" | "2days" | "week" | "2weeks" | "month" | "all"
type NameFilter = "all" | "mentions_only"

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: "Today",
  "2days": "Last 2 days",
  week: "Last week",
  "2weeks": "Last 2 weeks",
  month: "Last month",
  all: "All messages",
}

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
  const [importDestination, setImportDestination] = useState<ImportDestination>("inbox")
  const [newProjectName, setNewProjectName] = useState("")
  const [importedProjectId, setImportedProjectId] = useState<string | null>(null)

  // Scan filters
  const [dateRange, setDateRange] = useState<DateRange>("week")
  const [userName, setUserName] = useState("")
  const [nameFilter, setNameFilter] = useState<NameFilter>("all")

  const selectedTasks = tasks.filter((t) => t.selected)

  // Load saved name from localStorage
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("archaflow_scan_name")
      if (saved) setUserName(saved)
    }
  }, [open])

  // Save name when it changes
  useEffect(() => {
    if (userName.trim()) {
      localStorage.setItem("archaflow_scan_name", userName.trim())
    }
  }, [userName])

  function generateProjectName(taskList: ExtractedTask[]): string {
    if (taskList.length === 0) return "Imported Tasks"

    const STOP_WORDS = new Set([
      "i", "me", "my", "we", "our", "you", "your", "the", "a", "an", "is", "are",
      "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
      "did", "will", "would", "could", "should", "can", "may", "might", "shall",
      "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into",
      "about", "it", "its", "this", "that", "and", "or", "but", "if", "not", "no",
      "so", "up", "out", "all", "just", "get", "got", "also", "than", "then",
      "them", "they", "their", "there", "what", "when", "which", "who", "how",
      "need", "needs", "please", "make", "sure", "don't", "want", "going",
    ])

    const wordCount = new Map<string, number>()
    for (const task of taskList) {
      const words = task.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

      const seen = new Set<string>()
      for (const word of words) {
        if (!seen.has(word)) {
          seen.add(word)
          wordCount.set(word, (wordCount.get(word) || 0) + 1)
        }
      }
    }

    const sorted = [...wordCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))

    const today = new Date()
    const month = today.toLocaleString("en", { month: "short" })
    const day = today.getDate()

    if (sorted.length > 0) {
      return `${sorted.join(" & ")} — ${month} ${day}`
    }

    return `${providerName} Tasks — ${month} ${day}`
  }

  async function startScan() {
    setStatus("fetching")
    setErrorMessage("")

    try {
      const body: Record<string, unknown> = { connectionId, businessId, dateRange }
      if (nameFilter === "mentions_only" && userName.trim()) {
        body.userName = userName.trim()
      }

      const res = await fetch("/api/integrations/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

    if (importDestination === "new_project" && !newProjectName.trim()) {
      setErrorMessage("Please enter a project name")
      return
    }

    setStatus("importing")
    setErrorMessage("")

    try {
      const body: Record<string, unknown> = {
        sessionId,
        businessId,
        tasks: selectedTasks,
      }

      if (importDestination === "new_project") {
        body.projectName = newProjectName.trim()
      }

      const res = await fetch("/api/integrations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setErrorMessage(data.error || "Import failed")
        return
      }

      setImportedCount(data.imported)
      setImportedProjectId(data.projectId)
      setStatus("imported")

      window.dispatchEvent(new Event("projectsUpdated"))
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(err.message || "Import failed")
    }
  }

  function toggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, selected: !t.selected } : t))
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
    setTimeout(() => {
      setStatus("idle")
      setTasks([])
      setSessionId(null)
      setMessageCount(0)
      setExpandedTask(null)
      setErrorMessage("")
      setImportedCount(0)
      setImportDestination("inbox")
      setNewProjectName("")
      setImportedProjectId(null)
    }, 200)
  }

  const priorityColors: Record<string, string> = {
    low: "bg-[--af-bg-surface-alt] text-[--af-text-secondary] dark:bg-warm-800 dark:text-[--af-text-muted]",
    medium: "bg-[--af-info-bg] text-[--af-info-text]",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    urgent: "bg-[--af-danger-bg] text-[--af-danger-text]",
  }

  const destinationLabel = importDestination === "inbox"
    ? "Inbox"
    : newProjectName.trim() || "New Project"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Import className="w-5 h-5" />
            Scan {providerName} Messages
          </DialogTitle>
          <DialogDescription>
            {status === "idle" && "Configure your scan filters, then start scanning."}
            {status === "fetching" && "Fetching messages from selected channels..."}
            {status === "extracting" && "Analyzing messages for tasks..."}
            {status === "ready" &&
              `Found ${tasks.length} tasks from ${messageCount} messages.`}
            {status === "importing" && `Importing tasks to ${destinationLabel}...`}
            {status === "imported" &&
              `Successfully imported ${importedCount} tasks.`}
            {status === "error" && "Something went wrong."}
          </DialogDescription>
        </DialogHeader>

        {/* Scan configuration (idle state) */}
        {status === "idle" && (
          <div className="space-y-4 py-2">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[--af-text-muted]" />
                Time range
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.entries(DATE_RANGE_LABELS) as [DateRange, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setDateRange(value)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        dateRange === value
                          ? "bg-warm-900 text-white border-foreground dark:bg-[--af-bg-surface] dark:text-foreground dark:border-white"
                          : "bg-[--af-bg-surface] dark:bg-warm-900 border-[--af-border-default] dark:border-warm-700 hover:border-[--af-border-strong] dark:hover:border-[--af-border-strong]"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Name filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-[--af-text-muted]" />
                Your name
              </label>
              <Input
                placeholder="e.g. Jared"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="h-9 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setNameFilter("all")}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors flex-1 ${
                    nameFilter === "all"
                      ? "bg-warm-900 text-white border-foreground dark:bg-[--af-bg-surface] dark:text-foreground dark:border-white"
                      : "bg-[--af-bg-surface] dark:bg-warm-900 border-[--af-border-default] dark:border-warm-700 hover:border-[--af-border-strong] dark:hover:border-[--af-border-strong]"
                  }`}
                >
                  All messages
                </button>
                <button
                  onClick={() => setNameFilter("mentions_only")}
                  disabled={!userName.trim()}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors flex-1 ${
                    nameFilter === "mentions_only"
                      ? "bg-warm-900 text-white border-foreground dark:bg-[--af-bg-surface] dark:text-foreground dark:border-white"
                      : "bg-[--af-bg-surface] dark:bg-warm-900 border-[--af-border-default] dark:border-warm-700 hover:border-[--af-border-strong] dark:hover:border-[--af-border-strong] disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
                >
                  Only mentioning me
                </button>
              </div>
              {userName.trim() && nameFilter === "all" && (
                <p className="text-[11px] text-[--af-text-muted]">
                  Tasks mentioning &ldquo;{userName.trim()}&rdquo; will be prioritized
                </p>
              )}
            </div>
          </div>
        )}

        {/* Progress states */}
        {(status === "fetching" || status === "extracting" || status === "importing") && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-[--af-text-muted]">
              {status === "fetching" && "Fetching messages..."}
              {status === "extracting" && "Extracting tasks..."}
              {status === "importing" && "Importing tasks..."}
            </p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <AlertCircle className="w-8 h-8 text-[--af-danger-text]" />
            <p className="text-sm text-[--af-danger-text]">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={() => setStatus(tasks.length > 0 ? "ready" : "idle")}>
              {tasks.length > 0 ? "Back to Tasks" : "Back to Settings"}
            </Button>
          </div>
        )}

        {/* Imported state */}
        {status === "imported" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 className="w-8 h-8 text-[--af-success-text]" />
            <p className="text-sm text-[--af-text-secondary]">
              {importedCount} tasks imported to <span className="font-medium">{destinationLabel}</span>.
            </p>
            {importedProjectId && (
              <a
                href={`/projects/${importedProjectId}`}
                className="text-sm text-foreground underline hover:no-underline"
              >
                View project
              </a>
            )}
          </div>
        )}

        {/* Task review list */}
        {status === "ready" && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 max-h-[40vh] space-y-2 pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-sm text-[--af-text-muted]">
                  No actionable tasks found in the messages.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-3 space-y-2 bg-[--af-bg-surface] dark:bg-warm-950"
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
                        className="p-1 text-[--af-text-muted] hover:text-[--af-text-secondary]"
                      >
                        {expandedTask === task.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {expandedTask === task.id && (
                      <div className="ml-8 p-3 bg-[--af-bg-surface-alt] rounded text-xs space-y-1">
                        {task.description && (
                          <p className="text-[--af-text-secondary] mb-2">
                            {task.description}
                          </p>
                        )}
                        <p className="text-[--af-text-muted]">
                          <span className="font-medium">From:</span>{" "}
                          #{task.sourceMessage.channelName} by {task.sourceMessage.author}
                        </p>
                        <p className="text-[--af-text-muted] italic">
                          &ldquo;{task.sourceMessage.content.slice(0, 300)}
                          {task.sourceMessage.content.length > 300 ? "..." : ""}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Import destination picker */}
            {tasks.length > 0 && selectedTasks.length > 0 && (
              <div className="border rounded-lg p-3 space-y-3 bg-[--af-bg-surface-alt]">
                <p className="text-sm font-medium">Import destination</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImportDestination("inbox")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors flex-1 ${
                      importDestination === "inbox"
                        ? "border-foreground dark:border-white bg-[--af-bg-surface] dark:bg-warm-950"
                        : "border-[--af-border-default] dark:border-warm-700 hover:border-[--af-border-default] dark:hover:border-warm-600"
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    Inbox project
                  </button>
                  <button
                    onClick={() => {
                      setImportDestination("new_project")
                      if (!newProjectName.trim()) {
                        setNewProjectName(generateProjectName(selectedTasks))
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors flex-1 ${
                      importDestination === "new_project"
                        ? "border-foreground dark:border-white bg-[--af-bg-surface] dark:bg-warm-950"
                        : "border-[--af-border-default] dark:border-warm-700 hover:border-[--af-border-default] dark:hover:border-warm-600"
                    }`}
                  >
                    <FolderPlus className="w-4 h-4" />
                    New project
                  </button>
                </div>
                {importDestination === "new_project" && (
                  <Input
                    placeholder="Project name..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="h-9 text-sm"
                  />
                )}
              </div>
            )}
          </>
        )}

        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={startScan}>
                <Filter className="w-4 h-4 mr-1.5" />
                Start Scan
              </Button>
            </>
          )}
          {status === "ready" && tasks.length > 0 && (
            <>
              <div className="flex-1 text-sm text-[--af-text-muted]">
                {selectedTasks.length} of {tasks.length} tasks selected
              </div>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={importTasks}
                disabled={selectedTasks.length === 0 || (importDestination === "new_project" && !newProjectName.trim())}
              >
                Import {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""}
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
