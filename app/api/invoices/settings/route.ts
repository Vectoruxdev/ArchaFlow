import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = request.nextUrl.searchParams.get("businessId")
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get or create settings
    let { data: settings } = await admin
      .from("invoice_settings")
      .select("*")
      .eq("business_id", businessId)
      .single()

    if (!settings) {
      const { data: newSettings, error: insertError } = await admin
        .from("invoice_settings")
        .insert({ business_id: businessId })
        .select("*")
        .single()

      if (insertError) {
        console.error("Create invoice settings error:", insertError)
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 })
      }
      settings = newSettings
    }

    return NextResponse.json(settings)
  } catch (err: any) {
    console.error("Get invoice settings error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const { businessId, ...updates } = body

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify membership with admin/owner role
    const { data: membership } = await admin
      .from("user_roles")
      .select("id, role:roles(name)")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const roleName = (membership.role as any)?.name
    if (!["Owner", "Admin"].includes(roleName)) {
      return NextResponse.json({ error: "Only admins can update invoice settings" }, { status: 403 })
    }

    // Upsert settings
    const allowedFields: Record<string, any> = {}
    const fields = [
      "default_payment_terms",
      "default_tax_rate",
      "company_name",
      "company_address",
      "company_phone",
      "company_email",
      "footer_text",
    ]
    for (const f of fields) {
      if (updates[f] !== undefined) allowedFields[f] = updates[f]
    }
    allowedFields.updated_at = new Date().toISOString()

    const { data: settings, error: updateError } = await admin
      .from("invoice_settings")
      .upsert(
        { business_id: businessId, ...allowedFields },
        { onConflict: "business_id" }
      )
      .select("*")
      .single()

    if (updateError) {
      console.error("Update invoice settings error:", updateError)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json(settings)
  } catch (err: any) {
    console.error("Update invoice settings error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
