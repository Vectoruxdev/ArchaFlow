import { NextResponse } from "next/server"
import { verifySuperAdmin, isVerifyError } from "@/lib/admin/auth"

export async function GET() {
  const result = await verifySuperAdmin()

  if (isVerifyError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ userId: result.userId, email: result.email })
}
