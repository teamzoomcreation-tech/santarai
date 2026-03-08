import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type BulkBody = {
  tasks: Array<{ title: string; type?: string; status?: string }>
  agentId?: string
}

/** Map frontend/agent status to DB status */
function toDbStatus(s: string | undefined): string {
  if (s === "in_progress") return "in_progress"
  return "pending"
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Supabase configuration missing" },
      { status: 500 }
    )
  }

  const { missionId } = await params
  if (!missionId?.trim()) {
    return NextResponse.json({ error: "missionId required" }, { status: 400 })
  }

  let body: BulkBody
  try {
    body = (await req.json()) as BulkBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const tasks = Array.isArray(body.tasks) ? body.tasks : []
  if (tasks.length === 0) {
    return NextResponse.json({ error: "tasks array required and non-empty" }, { status: 400 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const agentId = (body.agentId ?? "ZEN").toString().trim()
  const rows = tasks.map((t) => ({
    mission_id: missionId.trim(),
    agent_id: agentId,
    title: String(t.title ?? "").trim() || "Tâche",
    output_url: null,
    status: toDbStatus(t.status),
  }))

  const { error } = await supabaseAdmin.from("tasks").insert(rows)
  if (error) {
    console.error("Bulk tasks insert error:", error)
    return NextResponse.json(
      { error: "Impossible d'ajouter les tâches au Kanban." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, count: rows.length })
}
