import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendContractSignedEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

// GET: Load contract data for the public signing page
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: contract, error: contractError } = await admin
      .from("contracts")
      .select("name, signer_name, content, type, pdf_url, status, token_expires_at")
      .eq("signing_token", token)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Invalid or expired signing link" },
        { status: 404 }
      )
    }

    // Check expiry
    if (
      contract.status !== "signed" &&
      contract.token_expires_at &&
      new Date(contract.token_expires_at) < new Date()
    ) {
      await admin
        .from("contracts")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("signing_token", token)

      return NextResponse.json(
        { error: "This signing link has expired" },
        { status: 400 }
      )
    }

    // Mark as viewed if currently sent
    if (contract.status === "sent") {
      await admin
        .from("contracts")
        .update({ status: "viewed", viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("signing_token", token)
    }

    return NextResponse.json({
      name: contract.name,
      signerName: contract.signer_name,
      content: contract.content,
      type: contract.type,
      pdfUrl: contract.pdf_url,
      status: contract.status,
    })
  } catch (err: any) {
    console.error("Get contract for signing error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, signatureData, signerIp } = body

    if (!token || !signatureData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Load contract by signing token
    const { data: contract, error: contractError } = await admin
      .from("contracts")
      .select("*")
      .eq("signing_token", token)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Invalid or expired signing link" },
        { status: 404 }
      )
    }

    // Check status
    if (contract.status === "signed") {
      return NextResponse.json(
        { error: "This contract has already been signed" },
        { status: 400 }
      )
    }

    if (["declined", "expired"].includes(contract.status)) {
      return NextResponse.json(
        { error: "This contract is no longer available for signing" },
        { status: 400 }
      )
    }

    // Check token expiry
    if (contract.token_expires_at && new Date(contract.token_expires_at) < new Date()) {
      // Auto-expire
      await admin
        .from("contracts")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", contract.id)

      return NextResponse.json(
        { error: "This signing link has expired" },
        { status: 400 }
      )
    }

    // Mark as signed
    const now = new Date().toISOString()
    const { error: updateError } = await admin
      .from("contracts")
      .update({
        status: "signed",
        signed_at: now,
        signature_data: signatureData,
        signer_ip: signerIp || request.headers.get("x-forwarded-for") || null,
        updated_at: now,
      })
      .eq("id", contract.id)

    if (updateError) {
      console.error("Sign update error:", updateError)
      return NextResponse.json(
        { error: "Failed to record signature" },
        { status: 500 }
      )
    }

    // Send confirmation emails
    try {
      // Get the sender's email
      const { data: creator } = await admin.auth.admin.getUserById(contract.created_by)
      const recipients = [contract.signer_email]
      if (creator?.user?.email) {
        recipients.push(creator.user.email)
      }

      await sendContractSignedEmail({
        to: recipients,
        contractName: contract.name,
        signerName: contract.signer_name,
      })
    } catch (emailErr) {
      console.error("Signed email error:", emailErr)
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: contract.business_id,
        user_id: null,
        activity_type: "contract_signed",
        entity_type: "contract",
        entity_id: contract.id,
        message: `${contract.signer_name} signed "${contract.name}"`,
        metadata: {},
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Sign contract API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
