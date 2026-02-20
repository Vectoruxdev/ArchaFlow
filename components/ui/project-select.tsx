"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { Search, X, FolderOpen } from "lucide-react"

interface ProjectOption {
  id: string
  title: string
}

interface ProjectSelectProps {
  value: { projectId: string | null; displayName: string }
  onChange: (value: { projectId: string | null; displayName: string }) => void
  placeholder?: string
}

export function ProjectSelect({
  value,
  onChange,
  placeholder = "Search for a project...",
}: ProjectSelectProps) {
  const { currentWorkspace } = useAuth()
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<ProjectOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const businessId = currentWorkspace?.id

  const searchProjects = useCallback(
    async (searchTerm: string) => {
      if (!businessId) return

      setIsLoading(true)
      try {
        let queryBuilder = supabase
          .from("projects")
          .select("id, title")
          .eq("business_id", businessId)
          .order("title", { ascending: true })
          .limit(10)

        if (searchTerm.trim()) {
          queryBuilder = queryBuilder.ilike("title", `%${searchTerm}%`)
        }

        const { data, error } = await queryBuilder

        if (error) throw error

        setOptions(
          (data || []).map((p: any) => ({
            id: p.id,
            title: p.title,
          }))
        )
      } catch (error) {
        console.error("Error searching projects:", error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    },
    [businessId]
  )

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      searchProjects(query)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, isOpen, searchProjects])

  useEffect(() => {
    if (isOpen) {
      searchProjects(query)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSelect = (project: ProjectOption) => {
    onChange({
      projectId: project.id,
      displayName: project.title,
    })
    setQuery("")
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange({ projectId: null, displayName: "" })
    setQuery("")
  }

  return (
    <div ref={containerRef} className="relative">
      {value.projectId ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900">
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <span className="flex-1 text-sm font-medium">{value.displayName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10"
          />
        </div>
      )}

      {isOpen && !value.projectId && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}

          {!isLoading && options.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              {query ? "No projects found." : "No projects in this workspace."}
            </div>
          )}

          {!isLoading &&
            options.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelect(project)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <FolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-sm font-medium truncate">{project.title}</p>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
