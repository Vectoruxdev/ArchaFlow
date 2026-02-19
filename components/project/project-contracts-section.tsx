"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileSignature, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { supabase } from "@/lib/supabase/client"

interface LinkedContract {
  id: string
  name: string
  status: string
  signerName: string
  sentAt: string | null
  signedAt: string | null
}

export function ProjectContractsSection({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [contracts, setContracts] = useState<LinkedContract[]>([])

  useEffect(() => {
    loadContracts()
  }, [projectId])

  const loadContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, name, status, signer_name, sent_at, signed_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setContracts(
        (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          signerName: c.signer_name,
          sentAt: c.sent_at,
          signedAt: c.signed_at,
        }))
      )
    } catch {
      // Silently fail — contracts table may not exist yet
    }
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileSignature className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Contracts</h2>
      </div>

      {contracts.length === 0 ? (
        <div className="py-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            No contracts linked to this project.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract</TableHead>
              <TableHead>Signer</TableHead>
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
                <TableCell className="font-medium text-sm">
                  {contract.name}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {contract.signerName}
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
      )}
    </div>
  )
}
