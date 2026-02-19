import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

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
      .select("id, business_id, name, status, signer_name")
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

    // Only void sent/viewed contracts
    if (!["sent", "viewed"].includes(contract.status)) {
      return NextResponse.json(
        { error: `Cannot void a ${contract.status} contract` },
        { status: 400 }
      )
    }

    // Update status to expired (voided)
    const { error: updateError } = await admin
      .from("contracts")
      .update({
        status: "expired",
        token_expires_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to void contract" },
        { status: 500 }
      )
    }

    // Record activity
    try {
      await admin.from("workspace_activities").insert({
        business_id: contract.business_id,
        user_id: user.id,
        activity_type: "contract_voided",
        entity_type: "contract",
        entity_id: contract.id,
        message: `Voided contract "${contract.name}"`,
        metadata: {},
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Void contract API error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
