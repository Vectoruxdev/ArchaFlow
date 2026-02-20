"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Eye, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContractStatusBadge } from "./contract-status-badge"

export interface ContractRow {
  id: string
  name: string
  status: string
  signerName: string | null
  signerEmail: string | null
  clientName: string | null
  projectTitle: string | null
  sentAt: string | null
  signedAt: string | null
  createdAt: string
}

interface Props {
  contracts: ContractRow[]
}

const STATUS_OPTIONS = ["sent", "viewed", "signed", "expired"]

export function ContractList({ contracts }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [sentFilter, setSentFilter] = useState("")

  // Derive unique client and project names for filter dropdowns
  const clientNames = useMemo(
    () => [...new Set(contracts.map((c) => c.clientName).filter(Boolean))] as string[],
    [contracts]
  )
  const projectTitles = useMemo(
    () => [...new Set(contracts.map((c) => c.projectTitle).filter(Boolean))] as string[],
    [contracts]
  )

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      // Text search across name, signer, email
      if (search) {
        const q = search.toLowerCase()
        const matchesSearch =
          c.name.toLowerCase().includes(q) ||
          (c.signerName?.toLowerCase().includes(q)) ||
          (c.signerEmail?.toLowerCase().includes(q)) ||
          (c.clientName?.toLowerCase().includes(q)) ||
          (c.projectTitle?.toLowerCase().includes(q))
        if (!matchesSearch) return false
      }
      if (statusFilter && c.status !== statusFilter) return false
      if (clientFilter && c.clientName !== clientFilter) return false
      if (projectFilter && c.projectTitle !== projectFilter) return false
      if (sentFilter && c.sentAt) {
        const sentDate = new Date(c.sentAt).toISOString().slice(0, 10)
        if (sentDate !== sentFilter) return false
      } else if (sentFilter && !c.sentAt) {
        return false
      }
      return true
    })
  }, [contracts, search, statusFilter, clientFilter, projectFilter, sentFilter])

  const hasFilters = search || statusFilter || clientFilter || projectFilter || sentFilter

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setClientFilter("")
    setProjectFilter("")
    setSentFilter("")
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[--af-border-default] rounded-lg">
        <p className="text-sm text-[--af-text-muted]">
          No contracts yet. Send your first contract from a template.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--af-text-muted]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts..."
            className="pl-9 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[120px]"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {clientNames.length > 0 && (
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="">All Clients</option>
            {clientNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
        {projectTitles.length > 0 && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
          >
            <option value="">All Projects</option>
            {projectTitles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={sentFilter}
          onChange={(e) => setSentFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[--af-text-muted]">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[--af-border-default] rounded-lg">
          <p className="text-sm text-[--af-text-muted]">
            No contracts match your filters.
          </p>
        </div>
      ) : (
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contract</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((contract) => (
          <TableRow
            key={contract.id}
            className="cursor-pointer"
            onClick={() => router.push(`/contracts/${contract.id}`)}
          >
            <TableCell>
              <div>
                <p className="font-medium text-sm">{contract.name}</p>
                {contract.signerEmail && (
                  <p className="text-xs text-[--af-text-muted]">{contract.signerEmail}</p>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-[--af-text-muted]">
              {contract.clientName || "—"}
            </TableCell>
            <TableCell className="text-sm text-[--af-text-muted]">
              {contract.projectTitle || "—"}
            </TableCell>
            <TableCell>
              <ContractStatusBadge status={contract.status} />
            </TableCell>
            <TableCell className="text-sm text-[--af-text-muted]">
              {contract.sentAt
                ? new Date(contract.sentAt).toLocaleDateString()
                : "—"}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/contracts/${contract.id}`)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      )}
    </div>
  )
}
