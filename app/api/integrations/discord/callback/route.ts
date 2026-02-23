import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { exchangeDiscordCode, fetchDiscordChannels } from "@/lib/integrations/discord"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

  try {
    const code = request.nextUrl.searchParams.get("code")
    const stateParam = request.nextUrl.searchParams.get("state")
    const error = request.nextUrl.searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${siteUrl}/integrations?error=${error}`)
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(`${siteUrl}/integrations?error=missing_params`)
    }

    // Verify state
    let state: { businessId: string; userId: string; nonce: string }
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64url").toString())
    } catch {
      return NextResponse.redirect(`${siteUrl}/integrations?error=invalid_state`)
    }

    const cookieStore = cookies()
    const storedNonce = cookieStore.get("integration_oauth_state")?.value
    if (!storedNonce || storedNonce !== state.nonce) {
      return NextResponse.redirect(`${siteUrl}/integrations?error=state_mismatch`)
    }

    cookieStore.set("integration_oauth_state", "", { maxAge: 0, path: "/" })

    // Exchange code for tokens
    const { accessToken, refreshToken, guildId, guildName, expiresAt } =
      await exchangeDiscordCode(code)

    // Upsert connection
    const botToken = process.env.DISCORD_BOT_TOKEN || ""

    const { data: connection, error: upsertError } = await supabaseAdmin
      .from("integration_connections")
      .upsert(
        {
          business_id: state.businessId,
          provider: "discord",
          access_token: accessToken,
          refresh_token: refreshToken,
          bot_token: botToken,
          token_expires_at: expiresAt,
          provider_metadata: { guild_id: guildId, guild_name: guildName },
          connected_by: state.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,provider" }
      )
      .select("id")
      .single()

    if (upsertError) throw upsertError

    // Fetch and cache channels using the bot token
    if (botToken && guildId) {
      try {
        const channels = await fetchDiscordChannels(botToken, guildId)
        if (channels.length > 0) {
          const channelRows = channels.map((ch) => ({
            connection_id: connection.id,
            channel_id: ch.id,
            channel_name: ch.name,
            channel_type: ch.type,
          }))

          await supabaseAdmin
            .from("integration_channels")
            .upsert(channelRows, { onConflict: "connection_id,channel_id" })
        }
      } catch (chError) {
        console.error("Failed to fetch Discord channels:", chError)
      }
    }

    // Record activity
    supabaseAdmin
      .from("workspace_activities")
      .insert({
        business_id: state.businessId,
        user_id: state.userId,
        activity_type: "integration_connected",
        entity_type: "integration",
        message: `Connected Discord server "${guildName}"`,
        metadata: { provider: "discord", guild_id: guildId, guild_name: guildName },
      })
      .then(({ error }) => {
        if (error) console.error("[Activity] integration_connected:", error)
      })

    return NextResponse.redirect(`${siteUrl}/integrations?connected=discord`)
  } catch (error: any) {
    console.error("Discord callback error:", error)
    return NextResponse.redirect(
      `${siteUrl}/integrations?error=${encodeURIComponent(error.message || "callback_failed")}`
    )
  }
}
