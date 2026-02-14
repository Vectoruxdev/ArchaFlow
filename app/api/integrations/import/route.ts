import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getOrCreateInboxProject } from "@/lib/integrations/inbox-project"
import type { ExtractedTask } from "@/lib/integrations/types"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId, businessId, tasks } = await request.json() as {
      sessionId: string
      businessId: string
      tasks: ExtractedTask[]
    }

    if (!sessionId || !businessId || !tasks || tasks.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Verify membership
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .single()

    if (!role) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 })
    }

    // Get or create Inbox project
    const inboxProject = await getOrCreateInboxProject(supabaseAdmin, businessId)

    // Get current max order_index for the project
    const { data: existingTasks } = await supabaseAdmin
      .from("project_tasks")
      .select("order_index")
      .eq("project_id", inboxProject.id)
      .order("order_index", { ascending: false })
      .limit(1)

    const startIndex = (existingTasks?.[0]?.order_index ?? -1) + 1

    // Insert tasks
    const tasksInsert = tasks.map((task, index) => ({
      project_id: inboxProject.id,
      title: task.title.trim(),
      order_index: startIndex + index,
    }))

    const { data: insertedTasks, error: insertError } = await supabaseAdmin
      .from("project_tasks")
      .insert(tasksInsert)
      .select("id")

    if (insertError) throw insertError

    const importedIds = (insertedTasks || []).map((t) => t.id)

    // Update scan session
    await supabaseAdmin
      .from("message_scan_sessions")
      .update({
        status: "imported",
        imported_task_ids: importedIds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    // Record activity
    supabaseAdmin
      .from("workspace_activities")
      .insert({
        business_id: businessId,
        user_id: user.id,
        activity_type: "tasks_imported",
        entity_type: "project",
        entity_id: inboxProject.id,
        message: `Imported ${importedIds.length} tasks from integration to Inbox`,
        metadata: { task_count: importedIds.length, session_id: sessionId },
      })
      .then(({ error }) => {
        if (error) console.error("[Activity] tasks_imported:", error)
      })

    return NextResponse.json({
      imported: importedIds.length,
      projectId: inboxProject.id,
      taskIds: importedIds,
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 })
  }
}
