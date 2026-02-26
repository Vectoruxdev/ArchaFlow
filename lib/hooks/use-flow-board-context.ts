"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface BoardColumn {
  id: string
  label: string
  colorKey: string
}

interface WorkspaceMember {
  id: string
  name: string
  email: string
}

interface FlowBoardContext {
  columns: BoardColumn[]
  teamMembers: WorkspaceMember[]
  isLoading: boolean
  error: string | null
  resolveColumnName: (id: string) => string
}

export function useFlowBoardContext(boardId: string | undefined): FlowBoardContext {
  const [columns, setColumns] = useState<BoardColumn[]>([])
  const [teamMembers, setTeamMembers] = useState<WorkspaceMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!boardId) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function fetchContext() {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch columns and members in parallel
        const [columnsRes, membersRes] = await Promise.all([
          supabase
            .from('project_statuses')
            .select('id, label, color_key')
            .eq('business_id', boardId)
            .order('order_index'),
          supabase
            .from('user_roles')
            .select('user_id, first_name, last_name, email')
            .eq('business_id', boardId),
        ])

        if (cancelled) return

        if (columnsRes.error) throw columnsRes.error
        if (membersRes.error) throw membersRes.error

        setColumns(
          (columnsRes.data ?? []).map((s: { id: string; label: string; color_key: string }) => ({
            id: s.label.toLowerCase(),
            label: s.label,
            colorKey: s.color_key,
          }))
        )

        setTeamMembers(
          (membersRes.data ?? []).map((m: { user_id: string; first_name: string | null; last_name: string | null; email: string }) => ({
            id: m.user_id,
            name: `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.email,
            email: m.email,
          }))
        )
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load board context')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchContext()
    return () => { cancelled = true }
  }, [boardId])

  function resolveColumnName(id: string): string {
    return columns.find(c => c.id === id)?.label ?? id
  }

  return { columns, teamMembers, isLoading, error, resolveColumnName }
}
