/**
 * Auto-Exécution des Tâches — Productivité Réelle
 *
 * POST /api/projects/[id]/auto-execute
 * Après création d'un projet par le Conductor, lance automatiquement
 * l'exécution IA de toutes les tâches pending du projet.
 *
 * Stratégie : exécution en parallèle (max 3 simultanés) pour rester
 * dans le timeout Vercel de 30s.
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
  missions: { agent_name: string | null } | null
}

async function executeOneTask(
  supabase: ReturnType<typeof createClient>,
  openai: OpenAI,
  task: TaskRow
): Promise<{ id: string; success: boolean; error?: string }> {
  try {
    const instruction = task.description || task.title || "Complète cette tâche selon les directives du projet."
    const agentRole = task.missions?.agent_name || "Assistant IA SantarAI"

    const systemPrompt = `Tu es un expert d'élite de l'agence virtuelle SantarAI. Tu produis des livrables B2B haut de gamme.

RÈGLES ABSOLUES :
1. AUCUN style conversationnel. Ne commence pas par bonjour, ni "Voici le travail", ni "J'ai préparé". Ton direct, sec, orienté résultat.
2. AUCUN emoji. Ponctuation neutre. Ton professionnel.
3. Structure obligatoire Markdown :

# [Titre professionnel du Livrable]

## Executive Summary
(1 phrase sur l'objectif accompli)

## Cœur du Livrable
(Contenu principal : texte, plan, analyse, code — exploitable immédiatement)

## Recommandations Stratégiques
(2 bullet points ultra-pertinents pour la suite)

4. Rôle : ${agentRole}. Ne coupe jamais ta réponse. Produis le livrable complet.`

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

    const { error } = await supabase
      .from("tasks")
      .update({
        output_content: outputContent,
        output_type: outputType,
        status: "done",
        updated_at: new Date().toISOString(),
      })
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
  req: Request,
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

  // 1. Récupérer toutes les tâches pending de ce projet
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, agent_id, status, missions(agent_name)")
    .eq("status", "pending")
    .in(
      "mission_id",
      supabase
        .from("missions")
        .select("id")
        .eq("project_id", projectId)
    )
    .limit(10) // Sécurité : max 10 tâches en auto-exec

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ message: "Aucune tâche pending", executed: 0 })
  }

  // 2. Marquer toutes les tâches comme "in_progress"
  const taskIds = tasks.map((t) => t.id)
  await supabase
    .from("tasks")
    .update({ status: "in_progress" })
    .in("id", taskIds)

  const openai = new OpenAI({ apiKey: openaiKey })

  // 3. Exécuter en parallèle par batch de CONCURRENT_LIMIT
  const results: { id: string; success: boolean; error?: string }[] = []

  for (let i = 0; i < tasks.length; i += CONCURRENT_LIMIT) {
    const batch = tasks.slice(i, i + CONCURRENT_LIMIT) as TaskRow[]
    const batchResults = await Promise.allSettled(
      batch.map((task) => executeOneTask(supabase, openai, task))
    )
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value)
      } else {
        results.push({ id: "unknown", success: false, error: result.reason?.message })
      }
    }
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  // 4. Mettre à jour le statut des missions → "done" si toutes leurs tâches le sont
  const { data: missions } = await supabase
    .from("missions")
    .select("id")
    .eq("project_id", projectId)

  if (missions?.length) {
    for (const mission of missions) {
      const { data: missionTasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("mission_id", mission.id)

      const allDone = missionTasks?.every((t) => t.status === "done")
      if (allDone) {
        await supabase
          .from("missions")
          .update({ status: "done" })
          .eq("id", mission.id)
      }
    }
  }

  return NextResponse.json({
    success: true,
    total: tasks.length,
    executed: succeeded,
    failed,
    results,
  })
}
