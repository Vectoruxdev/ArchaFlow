import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { fetchSlackChannels } from "@/lib/integrations/slack"
import { fetchDiscordChannels } from "@/lib/integrations/discord"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { connectionId, businessId } = await request.json()
    if (!connectionId || !businessId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Verify membership
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!role) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    // Get connection details
    const { data: connection, error: connError } = await supabaseAdmin
      .from("integration_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("business_id", businessId)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Fetch channels from provider
    let channels: { id: string; name: string; type: string }[]

    if (connection.provider === "slack") {
      channels = await fetchSlackChannels(connection.bot_token || connection.access_token)
    } else if (connection.provider === "discord") {
      const guildId = (connection.provider_metadata as any)?.guild_id
      if (!guildId || !connection.bot_token) {
        return NextResponse.json({ error: "Missing guild ID or bot token" }, { status: 400 })
      }
      channels = await fetchDiscordChannels(connection.bot_token, guildId)
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
    }

    // Upsert channels
    if (channels.length > 0) {
      const channelRows = channels.map((ch) => ({
        connection_id: connectionId,
        channel_id: ch.id,
        channel_name: ch.name,
        channel_type: ch.type,
        last_synced_at: new Date().toISOString(),
      }))

      await supabaseAdmin
        .from("integration_channels")
        .upsert(channelRows, { onConflict: "connection_id,channel_id" })
    }

    return NextResponse.json({ synced: channels.length })
  } catch (error: any) {
    console.error("Channel sync error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
