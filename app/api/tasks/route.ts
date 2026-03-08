import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type TaskInput = { title: string; type?: string; status?: string }
type PostBody = {
  tasks: TaskInput[]
  missionId: string
  projectId?: string
  agentId?: string
}

function toDbStatus(s: string | undefined): string {
  if (s === "in_progress") return "in_progress"
  return "pending"
}

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Supabase configuration missing" },
      { status: 500 }
    )
  }

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { tasks: tasksInput, missionId, agentId } = body
  const tasks = Array.isArray(tasksInput) ? tasksInput : []
  if (tasks.length === 0 || !missionId?.trim()) {
    return NextResponse.json(
      { error: "tasks (non-empty array) and missionId are required" },
      { status: 400 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const agentIdStr = (agentId ?? "ZEN").toString().trim()
  const rows = tasks.map((t) => ({
    mission_id: missionId.trim(),
    agent_id: agentIdStr,
    title: String(t.title ?? "").trim() || "Tâche",
    output_url: null,
    status: toDbStatus(t.status),
  }))

  const { error } = await supabaseAdmin.from("tasks").insert(rows)
  if (error) {
    console.error("Tasks insert error:", error)
    return NextResponse.json(
      { error: "Impossible d'ajouter les tâches au Kanban." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, count: rows.length }, { status: 200 })
}
