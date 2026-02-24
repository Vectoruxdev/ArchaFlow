"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ContractTemplateList, type ContractTemplate } from "@/components/contracts/contract-template-list"
import { ContractList, type ContractRow } from "@/components/contracts/contract-list"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import { PageTransition } from "@/components/ui/page-transition"

type Tab = "templates" | "contracts"

export default function ContractsPage() {
  const { currentWorkspace } = useAuth()
  const [tab, setTab] = useState<Tab>("templates")
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadData()
    }
  }, [currentWorkspace?.id])

  const loadData = async () => {
    if (!currentWorkspace?.id) return
    setLoading(true)

    try {
      const [templatesRes, contractsRes] = await Promise.all([
        supabase
          .from("contract_templates")
          .select("id, name, description, type, variables, created_at, updated_at, archived_at")
          .eq("business_id", currentWorkspace.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("contracts")
          .select("id, name, status, signer_name, signer_email, client_id, project_id, sent_at, signed_at, created_at")
          .eq("business_id", currentWorkspace.id)
          .order("created_at", { ascending: false }),
      ])

      if (templatesRes.data) {
        setTemplates(
          templatesRes.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            type: t.type,
            variables: t.variables || [],
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            archivedAt: t.archived_at,
          }))
        )
      }

      if (contractsRes.data) {
        // Load client and project names for the contracts
        const clientIds = [...new Set(contractsRes.data.filter((c: any) => c.client_id).map((c: any) => c.client_id))]
        const projectIds = [...new Set(contractsRes.data.filter((c: any) => c.project_id).map((c: any) => c.project_id))]

        const [clientsRes, projectsRes] = await Promise.all([
          clientIds.length > 0
            ? supabase.from("clients").select("id, first_name, last_name").in("id", clientIds)
            : Promise.resolve({ data: [] }),
          projectIds.length > 0
            ? supabase.from("projects").select("id, title").in("id", projectIds)
            : Promise.resolve({ data: [] }),
        ])

        const clientMap: Record<string, string> = {}
        for (const c of clientsRes.data || []) {
          clientMap[c.id] = `${c.first_name} ${c.last_name}`.trim()
        }

        const projectMap: Record<string, string> = {}
        for (const p of projectsRes.data || []) {
          projectMap[p.id] = p.title
        }

        setContracts(
          contractsRes.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            signerName: c.signer_name,
            signerEmail: c.signer_email,
            clientName: c.client_id ? clientMap[c.client_id] || null : null,
            projectTitle: c.project_id ? projectMap[c.project_id] || null : null,
            sentAt: c.sent_at,
            signedAt: c.signed_at,
            createdAt: c.created_at,
          }))
        )
      }
    } catch (err) {
      console.error("Error loading contracts data:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <PageTransition>
      <div className="min-h-screen bg-[--af-bg-canvas] dark:bg-warm-950">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[--af-bg-surface] border-b border-[--af-border-default]">
          <div className="p-6">
            <h1 className="text-2xl font-display font-bold tracking-tight">Contracts</h1>
            <p className="text-sm text-[--af-text-muted] mt-1">
              Create templates, send contracts, and collect signatures
            </p>
          </div>
          {/* Tabs */}
          <div className="px-6 flex gap-0">
            {(["templates", "contracts"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize",
                  tab === t
                    ? "border-foreground dark:border-white text-foreground"
                    : "border-transparent text-[--af-text-muted] hover:text-[--af-text-secondary] dark:hover:text-[--af-text-muted]"
                )}
              >
                {t === "templates" ? "Templates" : "All Contracts"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "var(--af-density-page-padding)" }}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-[--af-bg-surface-alt] dark:bg-warm-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : tab === "templates" ? (
            <ContractTemplateList
              templates={templates}
              businessId={currentWorkspace?.id || ""}
              onRefresh={loadData}
            />
          ) : (
            <ContractList contracts={contracts} />
          )}
        </div>
      </div>
      </PageTransition>
    </AppLayout>
  )
}
