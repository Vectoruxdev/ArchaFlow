import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { exchangeSlackCode, fetchSlackChannels } from "@/lib/integrations/slack"
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

    // Clear the state cookie
    cookieStore.set("integration_oauth_state", "", { maxAge: 0, path: "/" })

    // Exchange code for tokens
    const { accessToken, botToken, teamId, teamName } = await exchangeSlackCode(code)

    // Upsert connection
    const { data: connection, error: upsertError } = await supabaseAdmin
      .from("integration_connections")
      .upsert(
        {
          business_id: state.businessId,
          provider: "slack",
          access_token: accessToken,
          bot_token: botToken,
          provider_metadata: { team_id: teamId, team_name: teamName },
          connected_by: state.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,provider" }
      )
      .select("id")
      .single()

    if (upsertError) throw upsertError

    // Fetch and cache channels
    try {
      const channels = await fetchSlackChannels(botToken)
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
      console.error("Failed to fetch Slack channels:", chError)
      // Non-fatal — connection is still saved
    }

    // Record activity
    supabaseAdmin
      .from("workspace_activities")
      .insert({
        business_id: state.businessId,
        user_id: state.userId,
        activity_type: "integration_connected",
        entity_type: "integration",
        message: `Connected Slack workspace "${teamName}"`,
        metadata: { provider: "slack", team_id: teamId, team_name: teamName },
      })
      .then(({ error }) => {
        if (error) console.error("[Activity] integration_connected:", error)
      })

    return NextResponse.redirect(`${siteUrl}/integrations?connected=slack`)
  } catch (error: any) {
    console.error("Slack callback error:", error)
    return NextResponse.redirect(
      `${siteUrl}/integrations?error=${encodeURIComponent(error.message || "callback_failed")}`
    )
  }
}
