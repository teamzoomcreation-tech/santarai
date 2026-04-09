/**
 * Auto-Exécution des Tâches — Productivité Réelle
 * POST /api/projects/[id]/auto-execute
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

export const maxDuration = 60

const CONCURRENT_LIMIT = 3

async function executeOneTask(
  supabase: any,
  openai: OpenAI,
  task: any
): Promise<{ id: string; success: boolean; error?: string }> {
  try {
    const instruction =
      (task.description as string) ||
      (task.title as string) ||
      "Complète cette tâche selon les directives du projet."
    const agentRole = (task.agent_name as string) || "Assistant IA SantarAI"

    const systemPrompt = `Tu es un expert d'élite de l'agence virtuelle SantarAI. Tu produis des livrables B2B haut de gamme.

RÈGLES ABSOLUES :
1. AUCUN style conversationnel. Ton direct, sec, orienté résultat. Pas de bonjour, pas de "Voici".
2. AUCUN emoji. Ponctuation neutre. Ton professionnel et factuel.
3. Structure obligatoire Markdown :

# [Titre professionnel du Livrable]

## Executive Summary
(1 phrase sur l'objectif accompli)

## Cœur du Livrable
(Contenu principal : texte, plan, analyse, code — exploitable immédiatement)

## Recommandations Stratégiques
(2 bullet points ultra-pertinents pour la suite)

4. Rôle : ${agentRole}. Produis le livrable complet sans couper ta réponse.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: instruction },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    })

    const outputContent =
      completion.choices[0]?.message?.content?.trim() || "(Aucun contenu généré)"

    const isCode =
      /^```[\s\S]*?```/m.test(outputContent) ||
      outputContent.includes("function ") ||
      outputContent.includes("const ") ||
      outputContent.includes("SELECT ") ||
      outputContent.includes("import ")

    const { error } = await supabase
      .from("tasks")
      .update({
        output_content: outputContent,
        output_type: isCode ? "code" : "text",
        status: "done",
      })
      .eq("id", task.id as string)

    if (error) return { id: task.id as string, success: false, error: error.message }
    return { id: task.id as string, success: true }
  } catch (err) {
    return {
      id: (task.id as string) ?? "unknown",
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    }
  }
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl || !serviceKey || !openaiKey) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 })
  }

  // Client admin Supabase (bypass RLS)
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Récupérer les missions du projet
  const { data: missions, error: missionsError } = await supabase
    .from("missions")
    .select("id, agent_name")
    .eq("project_id", projectId)

  if (missionsError || !missions || (missions as any[]).length === 0) {
    return NextResponse.json({ message: "Aucune mission trouvée", executed: 0 })
  }

  const missionIds: string[] = (missions as any[]).map((m) => m.id)
  const agentByMission: Record<string, string> = {}
  for (const m of missions as any[]) {
    if (m.agent_name) agentByMission[m.id] = m.agent_name
  }

  // 2. Récupérer les tâches pending de ces missions
  const { data: rawTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, agent_id, status, mission_id")
    .in("mission_id", missionIds)
    .eq("status", "pending")
    .limit(10)

  if (tasksError || !rawTasks || (rawTasks as any[]).length === 0) {
    return NextResponse.json({ message: "Aucune tâche pending", executed: 0 })
  }

  // Enrichir avec le nom de l'agent depuis la mission
  const tasks = (rawTasks as any[]).map((t) => ({
    ...t,
    agent_name: t.mission_id ? (agentByMission[t.mission_id] ?? null) : null,
  }))

  // 3. Marquer toutes les tâches "in_progress"
  const taskIds = tasks.map((t) => t.id as string)
  await supabase.from("tasks").update({ status: "in_progress" }).in("id", taskIds)

  const openai = new OpenAI({ apiKey: openaiKey })
  const results: { id: string; success: boolean; error?: string }[] = []

  // 4. Exécuter en batches parallèles
  for (let i = 0; i < tasks.length; i += CONCURRENT_LIMIT) {
    const batch = tasks.slice(i, i + CONCURRENT_LIMIT)
    const settled = await Promise.allSettled(
      batch.map((task) => executeOneTask(supabase, openai, task))
    )
    for (const r of settled) {
      results.push(
        r.status === "fulfilled"
          ? r.value
          : { id: "unknown", success: false, error: String(r.reason) }
      )
    }
  }

  // 5. Passer les missions en "done" si toutes leurs tâches le sont
  for (const missionId of missionIds) {
    const { data: mTasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("mission_id", missionId)

    if (
      Array.isArray(mTasks) &&
      mTasks.length > 0 &&
      (mTasks as any[]).every((t) => t.status === "done")
    ) {
      await supabase.from("missions").update({ status: "done" }).eq("id", missionId)
    }
  }

  return NextResponse.json({
    success: true,
    total: tasks.length,
    executed: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  })
}
