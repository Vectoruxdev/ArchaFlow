import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const BUCKET_NAME = "project-files"

/**
 * DELETE /api/projects/files?fileId=...
 * Deletes a project file record and its storage object.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fileId = request.nextUrl.searchParams.get("fileId")
    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Fetch the file record
    const { data: file, error: fileError } = await admin
      .from("project_files")
      .select("id, project_id, url")
      .eq("id", fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Verify the user has access to this project's workspace
    const { data: project } = await admin
      .from("projects")
      .select("business_id")
      .eq("id", file.project_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", project.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Extract storage path from public URL
    // URL format: .../storage/v1/object/public/project-files/{projectId}/attachments/{filename}
    const storagePath = extractStoragePath(file.url)

    // Delete from storage (non-fatal if it fails — file may have been manually removed)
    if (storagePath) {
      const { error: storageError } = await admin.storage
        .from(BUCKET_NAME)
        .remove([storagePath])

      if (storageError) {
        console.warn("[delete-file] Storage deletion failed (continuing):", storageError.message)
      }
    }

    // Delete the database record
    const { error: deleteError } = await admin
      .from("project_files")
      .delete()
      .eq("id", fileId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[delete-file] Error:", error)
    return NextResponse.json(
      { error: error?.message ?? "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

/**
 * Extract the storage path from a Supabase public URL.
 * e.g. "https://xxx.supabase.co/storage/v1/object/public/project-files/abc/attachments/file.jpg"
 *   => "abc/attachments/file.jpg"
 */
function extractStoragePath(url: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.slice(idx + marker.length))
  } catch {
    return null
  }
}
