import { WebClient } from "@slack/web-api"
import type { NormalizedMessage } from "./types"

export function getSlackOAuthURL(state: string): string {
  const clientId = process.env.SLACK_CLIENT_ID
  if (!clientId) throw new Error("Missing SLACK_CLIENT_ID")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const redirectUri = `${siteUrl}/api/integrations/slack/callback`
  const scopes = "channels:read,channels:history,groups:read,groups:history,users:read"

  return (
    `https://slack.com/oauth/v2/authorize?` +
    `client_id=${clientId}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`
  )
}

export async function exchangeSlackCode(code: string): Promise<{
  accessToken: string
  botToken: string
  teamId: string
  teamName: string
}> {
  const clientId = process.env.SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("Missing Slack credentials")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const redirectUri = `${siteUrl}/api/integrations/slack/callback`

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  const data = await response.json()
  if (!data.ok) throw new Error(`Slack OAuth error: ${data.error}`)

  return {
    accessToken: data.access_token || data.authed_user?.access_token || "",
    botToken: data.access_token || "",
    teamId: data.team?.id || "",
    teamName: data.team?.name || "",
  }
}

export async function fetchSlackChannels(
  botToken: string
): Promise<{ id: string; name: string; type: string }[]> {
  const client = new WebClient(botToken)
  const channels: { id: string; name: string; type: string }[] = []

  // Public channels
  let cursor: string | undefined
  do {
    const result = await client.conversations.list({
      types: "public_channel,private_channel",
      limit: 200,
      cursor,
    })
    for (const ch of result.channels || []) {
      if (ch.id && ch.name) {
        channels.push({
          id: ch.id,
          name: ch.name,
          type: ch.is_private ? "private" : "public",
        })
      }
    }
    cursor = result.response_metadata?.next_cursor || undefined
  } while (cursor)

  return channels
}

export async function fetchSlackMessages(
  botToken: string,
  channelId: string,
  channelName: string,
  limit = 200
): Promise<NormalizedMessage[]> {
  const client = new WebClient(botToken)

  const result = await client.conversations.history({
    channel: channelId,
    limit,
  })

  // Build user cache for display names
  const userIds = new Set<string>()
  for (const msg of result.messages || []) {
    if (msg.user) userIds.add(msg.user)
  }

  const userMap = new Map<string, string>()
  for (const uid of userIds) {
    try {
      const info = await client.users.info({ user: uid })
      userMap.set(
        uid,
        info.user?.real_name || info.user?.name || uid
      )
    } catch {
      userMap.set(uid, uid)
    }
  }

  return (result.messages || [])
    .filter((msg) => msg.text && msg.type === "message" && !msg.subtype)
    .map((msg) => ({
      id: msg.ts || crypto.randomUUID(),
      channelId,
      channelName,
      author: userMap.get(msg.user || "") || msg.user || "Unknown",
      content: msg.text || "",
      timestamp: msg.ts
        ? new Date(parseFloat(msg.ts) * 1000).toISOString()
        : new Date().toISOString(),
      provider: "slack" as const,
    }))
}
