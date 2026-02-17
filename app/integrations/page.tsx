"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChannelSelectDialog } from "@/components/integrations/channel-select-dialog"
import { MessageScanDialog } from "@/components/integrations/message-scan-dialog"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import { Check, Search, Settings, ExternalLink, Loader2 } from "lucide-react"
import type { Provider } from "@/lib/integrations/types"

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  category: "payment" | "storage" | "design" | "communication"
  provider?: Provider
  connectionId?: string
  providerMetadata?: Record<string, unknown>
}

const baseIntegrations: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Scan channels for tasks and action items",
    icon: "💬",
    connected: false,
    category: "communication",
    provider: "slack",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Extract tasks from server conversations",
    icon: "🎮",
    connected: false,
    category: "communication",
    provider: "discord",
  },
]

export default function IntegrationsPage() {
  const { currentWorkspace } = useAuth()
  const searchParams = useSearchParams()
  const businessId = currentWorkspace?.id || ""

  const [integrations, setIntegrations] = useState<Integration[]>(baseIntegrations)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [configureIntegration, setConfigureIntegration] = useState<Integration | null>(null)
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  // Channel & scan dialog state
  const [channelDialog, setChannelDialog] = useState<{
    open: boolean
    connectionId: string
    provider: Provider
    providerName: string
  }>({ open: false, connectionId: "", provider: "slack", providerName: "" })

  const [scanDialog, setScanDialog] = useState<{
    open: boolean
    connectionId: string
    providerName: string
  }>({ open: false, connectionId: "", providerName: "" })

  // Load real connection state on mount
  useEffect(() => {
    if (businessId) loadConnections()
  }, [businessId])

  // Handle OAuth redirect params
  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")
    if (connected) {
      // Refresh connections to show newly connected integration
      loadConnections()
    }
    if (error) {
      console.error("Integration OAuth error:", error)
    }
  }, [searchParams])

  async function loadConnections() {
    if (!businessId) return
    setLoadingConnections(true)
    try {
      const res = await fetch(`/api/integrations/connections?businessId=${businessId}`)
      const data = await res.json()
      const connections = data.connections || []

      setIntegrations((prev) =>
        prev.map((integration) => {
          if (!integration.provider) return integration
          const conn = connections.find(
            (c: any) => c.provider === integration.provider
          )
          if (conn) {
            return {
              ...integration,
              connected: true,
              connectionId: conn.id,
              providerMetadata: conn.provider_metadata,
            }
          }
          return { ...integration, connected: false, connectionId: undefined, providerMetadata: undefined }
        })
      )
    } catch (err) {
      console.error("Failed to load connections:", err)
    } finally {
      setLoadingConnections(false)
    }
  }

  function handleConnect(integration: Integration) {
    if (integration.provider === "slack" || integration.provider === "discord") {
      if (!businessId) {
        toast.error("No workspace selected. Please select a workspace first.")
        return
      }
      // OAuth redirect
      window.location.href = `/api/integrations/${integration.provider}/authorize?businessId=${businessId}`
    } else {
      // Mock toggle for non-implemented integrations
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, connected: !i.connected } : i))
      )
    }
  }

  async function handleDisconnect(integration: Integration) {
    if (integration.provider && integration.connectionId) {
      setDisconnecting(integration.id)
      try {
        await fetch("/api/integrations/connections", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId: integration.connectionId,
            businessId,
          }),
        })
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === integration.id
              ? { ...i, connected: false, connectionId: undefined, providerMetadata: undefined }
              : i
          )
        )
      } catch (err) {
        console.error("Disconnect failed:", err)
      } finally {
        setDisconnecting(null)
      }
    } else {
      // Mock toggle
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, connected: false } : i))
      )
    }
  }

  function handleConfigure(integration: Integration) {
    if (integration.provider && integration.connectionId) {
      setChannelDialog({
        open: true,
        connectionId: integration.connectionId,
        provider: integration.provider,
        providerName: integration.name,
      })
    } else {
      setConfigureIntegration(integration)
    }
  }

  function handleScanMessages() {
    setChannelDialog((prev) => ({ ...prev, open: false }))
    setScanDialog({
      open: true,
      connectionId: channelDialog.connectionId,
      providerName: channelDialog.providerName,
    })
  }

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const connectedCount = integrations.filter((i) => i.connected).length

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold mb-2">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your favorite tools to streamline your workflow. {connectedCount} of{" "}
            {integrations.length} connected.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "communication"].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  selectedCategory === category
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700"
            >
              {/* Icon and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">
                  {integration.icon}
                </div>
                {integration.connected && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </div>

              {/* Content */}
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-1">{integration.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {integration.description}
                </p>
                {integration.connected && integration.providerMetadata && (
                  <p className="text-[10px] text-gray-400 mt-1 truncate">
                    {(integration.providerMetadata as any).team_name ||
                      (integration.providerMetadata as any).guild_name ||
                      "Connected"}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {integration.connected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleConfigure(integration)}
                    >
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(integration)}
                      disabled={disconnecting === integration.id}
                      className="h-8 text-xs px-2 text-gray-600 dark:text-gray-400"
                    >
                      {disconnecting === integration.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleConnect(integration)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search or filter
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        )}

        {/* Generic Configure Dialog (for non-OAuth integrations) */}
        <Dialog
          open={!!configureIntegration && !configureIntegration.provider}
          onOpenChange={() => setConfigureIntegration(null)}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-2xl">{configureIntegration?.icon}</span>
                Configure {configureIntegration?.name}
              </DialogTitle>
              <DialogDescription>
                Manage settings and preferences for this integration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  placeholder="sk_live_..."
                  type="password"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Your API key is encrypted and stored securely
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  placeholder="https://your-domain.com/webhook"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Receive real-time updates from this integration
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium">Enable notifications</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Get notified of important events
                  </p>
                </div>
                <button className="relative w-11 h-6 rounded-full bg-black dark:bg-white transition-colors">
                  <div className="absolute top-0.5 translate-x-5 w-5 h-5 rounded-full bg-white dark:bg-black transition-transform" />
                </button>
              </div>
              <div className="pt-2">
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors"
                >
                  View documentation
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigureIntegration(null)}>
                Cancel
              </Button>
              <Button onClick={() => setConfigureIntegration(null)}>Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Channel Select Dialog (for Slack/Discord) */}
        <ChannelSelectDialog
          open={channelDialog.open}
          onOpenChange={(open) =>
            setChannelDialog((prev) => ({ ...prev, open }))
          }
          connectionId={channelDialog.connectionId}
          businessId={businessId}
          provider={channelDialog.provider}
          providerName={channelDialog.providerName}
          onScanMessages={handleScanMessages}
        />

        {/* Message Scan Dialog */}
        <MessageScanDialog
          open={scanDialog.open}
          onOpenChange={(open) =>
            setScanDialog((prev) => ({ ...prev, open }))
          }
          connectionId={scanDialog.connectionId}
          businessId={businessId}
          providerName={scanDialog.providerName}
        />
      </div>
    </AppLayout>
  )
}
