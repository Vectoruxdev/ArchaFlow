import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendContractEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessId,
      templateId,
      contractName,
      clientId,
      projectId,
      signerName,
      signerEmail,
      variableValues,
      expiryDays,
    } = body

    if (!businessId || !templateId || !signerName?.trim() || !signerEmail?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      )
    }

    // Load template
    const { data: template, error: templateError } = await admin
      .from("contract_templates")
      .select("*")
      .eq("id", templateId)
      .eq("business_id", businessId)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Replace variables in content
    let contentSnapshot = template.content
    if (contentSnapshot && variableValues) {
      let contentStr = JSON.stringify(contentSnapshot)
      for (const [key, value] of Object.entries(variableValues)) {
        contentStr = contentStr.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, "g"),
          String(value || "")
        )
      }
      contentSnapshot = JSON.parse(contentStr)
    }

    // Generate signing token and expiry
    const signingToken = crypto.randomUUID()
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + (expiryDays || 30))

    // Create contract record
    const { data: contract, error: insertError } = await admin
      .from("contracts")
      .insert({
        business_id: businessId,
        template_id: templateId,
        name: contractName?.trim() || template.name,
        type: template.type,
        content: contentSnapshot,
        pdf_url: template.pdf_url || null,
        client_id: clientId || null,
        project_id: projectId || null,
        status: "sent",
        signing_token: signingToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        variable_values: variableValues || {},
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim(),
        sent_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Contract insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to create contract" },
        { status: 500 }
      )
    }

    // Get sender name for email
    const { data: profile } = await admin
      .from("user_profiles")
      .select("first_name, last_name, full_name")
      .eq("id", user.id)
      .single()

    const senderName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        profile.full_name ||
        "Your team"
      : "Your team"

    // Send email
    try {
      await sendContractEmail({
        to: signerEmail.trim(),
        signerName: signerName.trim(),
        contractName: contractName?.trim() || template.name,
        senderName,
        signingToken,
      })
    } catch (emailErr) {
      console.error("Email send error:", emailErr)
      // Contract was created — don't fail the whole request
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: businessId,
        user_id: user.id,
        activity_type: "contract_sent",
        entity_type: "contract",
        entity_id: contract.id,
        message: `Sent contract "${contractName?.trim() || template.name}" to ${signerName.trim()}`,
        metadata: { signerEmail: signerEmail.trim() },
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({ id: contract.id, signingToken })
  } catch (err: any) {
    console.error("Send contract API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
