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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Hash, Lock, MessageSquare, Loader2 } from "lucide-react"
import type { IntegrationChannel, Provider } from "@/lib/integrations/types"

interface ChannelSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectionId: string
  businessId: string
  provider: Provider
  providerName: string
  onScanMessages: () => void
}

export function ChannelSelectDialog({
  open,
  onOpenChange,
  connectionId,
  businessId,
  provider,
  providerName,
  onScanMessages,
}: ChannelSelectDialogProps) {
  const [channels, setChannels] = useState<IntegrationChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const selectedCount = channels.filter((ch) => ch.is_selected).length

  useEffect(() => {
    if (open && connectionId) {
      loadChannels()
    }
  }, [open, connectionId])

  async function loadChannels() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/integrations/channels?connectionId=${connectionId}&businessId=${businessId}`
      )
      const data = await res.json()
      if (data.channels) setChannels(data.channels)
    } catch (err) {
      console.error("Failed to load channels:", err)
    } finally {
      setLoading(false)
    }
  }

  async function syncChannels() {
    setSyncing(true)
    try {
      await fetch("/api/integrations/channels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, businessId }),
      })
      await loadChannels()
    } catch (err) {
      console.error("Failed to sync channels:", err)
    } finally {
      setSyncing(false)
    }
  }

  async function toggleChannel(channel: IntegrationChannel) {
    const newSelected = !channel.is_selected

    // Optimistic update
    setChannels((prev) =>
      prev.map((ch) =>
        ch.id === channel.id ? { ...ch, is_selected: newSelected } : ch
      )
    )

    try {
      await fetch("/api/integrations/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          isSelected: newSelected,
          businessId,
        }),
      })
    } catch (err) {
      // Revert on error
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channel.id ? { ...ch, is_selected: !newSelected } : ch
        )
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {providerName} Channels
          </DialogTitle>
          <DialogDescription>
            Select channels to scan for actionable tasks. Messages will be
            analyzed by AI to extract tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-[--af-text-muted]">
            {selectedCount} of {channels.length} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={syncChannels}
            disabled={syncing}
            className="h-8 text-xs"
          >
            {syncing ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Sync Channels
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[40vh] border rounded-lg p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[--af-text-muted]" />
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-8 text-sm text-[--af-text-muted]">
              No channels found. Try syncing.
            </div>
          ) : (
            channels.map((channel) => (
              <label
                key={channel.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[--af-bg-surface-alt] cursor-pointer"
              >
                <Checkbox
                  checked={channel.is_selected}
                  onCheckedChange={() => toggleChannel(channel)}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {channel.channel_type === "private" ? (
                    <Lock className="w-3.5 h-3.5 text-[--af-text-muted] shrink-0" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 text-[--af-text-muted] shrink-0" />
                  )}
                  <span className="text-sm truncate">{channel.channel_name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {channel.channel_type || "text"}
                </Badge>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onScanMessages} disabled={selectedCount === 0}>
            Scan {selectedCount} Channel{selectedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
