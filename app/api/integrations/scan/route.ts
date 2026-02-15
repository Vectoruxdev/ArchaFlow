import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { fetchSlackMessages } from "@/lib/integrations/slack"
import { fetchDiscordMessages } from "@/lib/integrations/discord"
import { extractTasksFromMessages } from "@/lib/integrations/ai-extract"
import type { NormalizedMessage } from "@/lib/integrations/types"

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

    // Get connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from("integration_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("business_id", businessId)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    // Get selected channels
    const { data: selectedChannels } = await supabaseAdmin
      .from("integration_channels")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("is_selected", true)

    if (!selectedChannels || selectedChannels.length === 0) {
      return NextResponse.json({ error: "No channels selected" }, { status: 400 })
    }

    // Create scan session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("message_scan_sessions")
      .insert({
        connection_id: connectionId,
        business_id: businessId,
        initiated_by: user.id,
        status: "fetching",
        channel_ids: selectedChannels.map((ch) => ch.channel_id),
      })
      .select("id")
      .single()

    if (sessionError) throw sessionError

    // Fetch messages from all selected channels (only new messages since last scan)
    const allMessages: NormalizedMessage[] = []
    const token = connection.bot_token || connection.access_token
    const channelLatestTs: Record<string, string> = {}

    for (const ch of selectedChannels) {
      try {
        let messages: NormalizedMessage[]
        const after = ch.last_message_ts || undefined
        if (connection.provider === "slack") {
          messages = await fetchSlackMessages(token, ch.channel_id, ch.channel_name, 200, after)
        } else {
          messages = await fetchDiscordMessages(token, ch.channel_id, ch.channel_name, 200, after)
        }
        allMessages.push(...messages)

        // Track the latest message timestamp per channel for updating after import
        if (messages.length > 0) {
          if (connection.provider === "slack") {
            // Slack messages are sorted newest-first, and the original ts is stored in id
            channelLatestTs[ch.channel_id] = messages[0].id
          } else {
            // Discord messages are sorted newest-first, store the id (snowflake)
            channelLatestTs[ch.channel_id] = messages[0].id
          }
        }
      } catch (chError) {
        console.error(`Failed to fetch messages from ${ch.channel_name}:`, chError)
      }
    }

    // Update session with raw messages
    await supabaseAdmin
      .from("message_scan_sessions")
      .update({ status: "extracting", raw_messages: allMessages })
      .eq("id", session.id)

    // AI extraction
    let extractedTasks
    try {
      extractedTasks = await extractTasksFromMessages(allMessages)
    } catch (aiError: any) {
      await supabaseAdmin
        .from("message_scan_sessions")
        .update({ status: "failed", error_message: aiError.message })
        .eq("id", session.id)

      return NextResponse.json({ error: "AI extraction failed", sessionId: session.id }, { status: 500 })
    }

    // Update session with results
    await supabaseAdmin
      .from("message_scan_sessions")
      .update({
        status: "ready",
        extracted_tasks: extractedTasks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)

    // Update last_message_ts on channels so next scan skips these messages
    for (const [chId, latestTs] of Object.entries(channelLatestTs)) {
      await supabaseAdmin
        .from("integration_channels")
        .update({ last_message_ts: latestTs })
        .eq("connection_id", connectionId)
        .eq("channel_id", chId)
    }

    return NextResponse.json({
      sessionId: session.id,
      messageCount: allMessages.length,
      taskCount: extractedTasks.length,
      tasks: extractedTasks,
    })
  } catch (error: any) {
    console.error("Scan error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
