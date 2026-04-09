/**
 * Auto-Exécution des Tâches — Productivité Réelle
 *
 * POST /api/projects/[id]/auto-execute
 * Après création d'un projet par le Conductor, lance automatiquement
 * l'exécution IA de toutes les tâches pending du projet.
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

export const maxDuration = 60

const CONCURRENT_LIMIT = 3

interface TaskRow {
  id: string
  title: string | null
  description: string | null
  agent_id: string | null
  status: string | null
  mission_id: string | null
  agent_name?: string | null
}

async function executeOneTask(
  supabase: ReturnType<typeof createClient>,
  openai: OpenAI,
  task: TaskRow
): Promise<{ id: string; success: boolean; error?: string }> {
  try {
    const instruction =
      task.description || task.title || "Complète cette tâche selon les directives du projet."
    const agentRole = task.agent_name || "Assistant IA SantarAI"

    const systemPrompt = `Tu es un expert d'élite de l'agence virtuelle SantarAI. Tu produis des livrables B2B haut de gamme.

RÈGLES ABSOLUES :
1. AUCUN style conversationnel. Ton direct, sec, orienté résultat.
2. AUCUN emoji. Ponctuation neutre. Ton professionnel.
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
    const outputType = isCode ? "code" : "text"

    // Cast en unknown puis en object pour satisfaire les types stricts Supabase sans schema généré
    const updatePayload = {
      output_content: outputContent,
      output_type: outputType,
      status: "done",
    } as Record<string, unknown>

    const { error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", task.id)

    if (error) return { id: task.id, success: false, error: error.message }
    return { id: task.id, success: true }
  } catch (err) {
    return {
      id: task.id,
      success: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    }
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!supabaseUrl || !serviceKey || !openaiKey) {
    return NextResponse.json({ error: "Configuration serveur manquante" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Étape 1 : récupérer les IDs des missions du projet (requête séparée pour éviter les sous-requêtes TypeScript non typées)
  const { data: missions, error: missionsError } = await supabase
    .from("missions")
    .select("id, agent_name")
    .eq("project_id", projectId)

  if (missionsError || !missions || missions.length === 0) {
    return NextResponse.json({ message: "Aucune mission trouvée", executed: 0 })
  }

  const missionIds = missions.map((m: { id: string }) => m.id)
  const agentByMission: Record<string, string> = {}
  for (const m of missions as { id: string; agent_name: string | null }[]) {
    if (m.agent_name) agentByMission[m.id] = m.agent_name
  }

  // Étape 2 : récupérer les tâches pending de ces missions
  const { data: rawTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, agent_id, status, mission_id")
    .in("mission_id", missionIds)
    .eq("status", "pending")
    .limit(10)

  if (tasksError || !rawTasks || rawTasks.length === 0) {
    return NextResponse.json({ message: "Aucune tâche pending", executed: 0 })
  }

  // Enrichir les tâches avec le nom de l'agent depuis la mission
  const tasks: TaskRow[] = (rawTasks as TaskRow[]).map((t) => ({
    ...t,
    agent_name: t.mission_id ? (agentByMission[t.mission_id] ?? null) : null,
  }))

  // Étape 3 : marquer toutes les tâches "in_progress"
  const taskIds = tasks.map((t) => t.id)
  await supabase
    .from("tasks")
    .update({ status: "in_progress" } as Record<string, unknown>)
    .in("id", taskIds)

  const openai = new OpenAI({ apiKey: openaiKey })

  // Étape 4 : exécution en batches parallèles
  const results: { id: string; success: boolean; error?: string }[] = []

  for (let i = 0; i < tasks.length; i += CONCURRENT_LIMIT) {
    const batch = tasks.slice(i, i + CONCURRENT_LIMIT)
    const batchResults = await Promise.allSettled(
      batch.map((task) => executeOneTask(supabase, openai, task))
    )
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value)
      } else {
        results.push({
          id: "unknown",
          success: false,
          error: result.reason instanceof Error ? result.reason.message : "Erreur batch",
        })
      }
    }
  }

  // Étape 5 : mettre à jour le statut des missions → done si toutes leurs tâches le sont
  for (const missionId of missionIds) {
    const { data: missionTasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("mission_id", missionId)

    const allDone =
      Array.isArray(missionTasks) &&
      missionTasks.length > 0 &&
      missionTasks.every((t: { status: string }) => t.status === "done")

    if (allDone) {
      await supabase
        .from("missions")
        .update({ status: "done" } as Record<string, unknown>)
        .eq("id", missionId)
    }
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json({
    success: true,
    total: tasks.length,
    executed: succeeded,
    failed,
  })
}
