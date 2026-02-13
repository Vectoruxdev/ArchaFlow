"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronDown, ChevronRight } from "lucide-react"

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  completed: boolean
  assignees: { name: string; avatar: string }[]
  dueDate: string
  priority: "low" | "medium" | "high"
  subtasks?: Subtask[]
}

interface TaskListProps {
  tasks: Task[]
  onToggleTask?: (taskId: string) => void
  onToggleSubtask?: (taskId: string, subtaskId: string) => void
}

export function TaskList({ tasks, onToggleTask, onToggleSubtask }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const priorityColors = {
    low: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    high: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const hasSubtasks = task.subtasks && task.subtasks.length > 0
        const isExpanded = expandedTasks.has(task.id)
        const overdue = isOverdue(task.dueDate) && !task.completed

        return (
          <div
            key={task.id}
            className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3"
          >
            {/* Main Task */}
            <div className="flex items-start gap-3">
              {hasSubtasks && (
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleTask?.(task.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p
                    className={`text-sm font-medium ${
                      task.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className={overdue ? "text-red-500 font-medium" : ""}>
                      {new Date(task.dueDate).toLocaleDateString()}
                      {overdue && " (Overdue)"}
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {task.assignees.map((assignee, i) => (
                      <Avatar key={i} className="w-6 h-6 border-2 border-white dark:border-black">
                        <AvatarImage src={assignee.avatar} alt="" />
                        <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-800">
                          {assignee.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Subtasks */}
            {hasSubtasks && isExpanded && (
              <div className="ml-10 space-y-2 pt-2 border-t border-gray-100 dark:border-gray-900">
                {task.subtasks!.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => onToggleSubtask?.(task.id, subtask.id)}
                    />
                    <p
                      className={`text-sm ${
                        subtask.completed ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {subtask.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
