"use client"

import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function ContractList({ contracts }: Props) {
  const router = useRouter()

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
        <p className="text-sm text-gray-500">
          No contracts yet. Send your first contract from a template.
        </p>
      </div>
    )
  }

  return (
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
        {contracts.map((contract) => (
          <TableRow
            key={contract.id}
            className="cursor-pointer"
            onClick={() => router.push(`/contracts/${contract.id}`)}
          >
            <TableCell>
              <div>
                <p className="font-medium text-sm">{contract.name}</p>
                {contract.signerEmail && (
                  <p className="text-xs text-gray-500">{contract.signerEmail}</p>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {contract.clientName || "—"}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {contract.projectTitle || "—"}
            </TableCell>
            <TableCell>
              <ContractStatusBadge status={contract.status} />
            </TableCell>
            <TableCell className="text-sm text-gray-500">
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
  )
}
