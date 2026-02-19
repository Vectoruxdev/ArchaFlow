import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendContractEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Load contract
    const { data: contract, error: contractError } = await admin
      .from("contracts")
      .select("*")
      .eq("id", params.id)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Verify membership
    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", contract.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only remind for sent/viewed contracts
    if (!["sent", "viewed"].includes(contract.status)) {
      return NextResponse.json(
        { error: `Cannot send reminder for ${contract.status} contract` },
        { status: 400 }
      )
    }

    // Check token not expired
    if (contract.token_expires_at && new Date(contract.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Signing link has expired. Void and resend the contract." },
        { status: 400 }
      )
    }

    // Get sender name
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

    await sendContractEmail({
      to: contract.signer_email,
      signerName: contract.signer_name,
      contractName: contract.name,
      senderName,
      signingToken: contract.signing_token,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Remind API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
