import { getSupabaseAdmin } from "@/lib/supabase/admin"

/** Number of AI credits consumed per Gemini enhancement call */
export const CREDIT_COST_PER_ENHANCEMENT = 5

interface CreditCheckResult {
  allowed: boolean
  creditsUsed: number
  creditsLimit: number
  creditsNeeded: number
}

/**
 * Check whether a business has enough AI credits for the requested operation.
 */
export async function checkAICredits(
  businessId: string,
  creditsNeeded: number
): Promise<CreditCheckResult> {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from("businesses")
    .select("ai_credits_used, ai_credits_limit")
    .eq("id", businessId)
    .single()

  if (error || !data) {
    return { allowed: false, creditsUsed: 0, creditsLimit: 0, creditsNeeded }
  }

  const creditsUsed = data.ai_credits_used ?? 0
  const creditsLimit = data.ai_credits_limit ?? 0
  const remaining = creditsLimit - creditsUsed

  return {
    allowed: remaining >= creditsNeeded,
    creditsUsed,
    creditsLimit,
    creditsNeeded,
  }
}

/**
 * Deduct AI credits from a business and log usage.
 * Increments businesses.ai_credits_used and inserts a row into ai_credit_usage.
 */
export async function deductAICredits({
  businessId,
  userId,
  credits,
  feature,
  metadata,
}: {
  businessId: string
  userId: string
  credits: number
  feature: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const admin = getSupabaseAdmin()

  // Increment ai_credits_used on the business
  const { data: biz } = await admin
    .from("businesses")
    .select("ai_credits_used")
    .eq("id", businessId)
    .single()

  const currentUsed = biz?.ai_credits_used ?? 0

  await admin
    .from("businesses")
    .update({ ai_credits_used: currentUsed + credits })
    .eq("id", businessId)

  // Log to ai_credit_usage table
  await admin.from("ai_credit_usage").insert({
    business_id: businessId,
    user_id: userId,
    credits_used: credits,
    feature,
    metadata: metadata ?? {},
  })
}
