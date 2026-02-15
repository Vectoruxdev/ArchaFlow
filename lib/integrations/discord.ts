import type { NormalizedMessage } from "./types"

const DISCORD_API = "https://discord.com/api/v10"

export function getDiscordOAuthURL(state: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) throw new Error("Missing DISCORD_CLIENT_ID")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const redirectUri = `${siteUrl}/api/integrations/discord/callback`
  const scopes = "identify guilds bot"
  const permissions = "66560" // Read Messages + Read Message History

  return (
    `https://discord.com/oauth2/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&permissions=${permissions}` +
    `&state=${state}`
  )
}

export async function exchangeDiscordCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  guildId: string
  guildName: string
  expiresAt: string
}> {
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("Missing Discord credentials")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const redirectUri = `${siteUrl}/api/integrations/discord/callback`

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  const data = await response.json()
  if (data.error) throw new Error(`Discord OAuth error: ${data.error_description || data.error}`)

  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

  // Get guild info from the token response (if guild was selected)
  const guildId = data.guild?.id || ""
  const guildName = data.guild?.name || ""

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    guildId,
    guildName,
    expiresAt,
  }
}

export async function fetchDiscordChannels(
  botToken: string,
  guildId: string
): Promise<{ id: string; name: string; type: string }[]> {
  const response = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${botToken}` },
  })

  if (!response.ok) throw new Error(`Discord API error: ${response.status}`)

  const channels = await response.json()

  // Filter to text channels (type 0) and announcement channels (type 5)
  return channels
    .filter((ch: any) => ch.type === 0 || ch.type === 5)
    .map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      type: ch.type === 5 ? "announcement" : "text",
    }))
}

export async function fetchDiscordMessages(
  botToken: string,
  channelId: string,
  channelName: string,
  limit = 200,
  after?: string
): Promise<NormalizedMessage[]> {
  // Discord limits to 100 per request, so we may need multiple calls
  const messages: NormalizedMessage[] = []
  let before: string | undefined
  let remaining = limit

  while (remaining > 0) {
    const batchSize = Math.min(remaining, 100)
    let url = `${DISCORD_API}/channels/${channelId}/messages?limit=${batchSize}`
    if (after) url += `&after=${after}`
    else if (before) url += `&before=${before}`

    const response = await fetch(url, {
      headers: { Authorization: `Bot ${botToken}` },
    })

    if (!response.ok) break

    const batch: any[] = await response.json()
    if (batch.length === 0) break

    for (const msg of batch) {
      if (msg.content && !msg.author?.bot) {
        messages.push({
          id: msg.id,
          channelId,
          channelName,
          author: msg.author?.global_name || msg.author?.username || "Unknown",
          content: msg.content,
          timestamp: msg.timestamp,
          provider: "discord",
        })
      }
    }

    before = batch[batch.length - 1].id
    remaining -= batch.length

    if (batch.length < batchSize) break
  }

  return messages
}
