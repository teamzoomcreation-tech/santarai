import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import OpenAI from "openai"

export const maxDuration = 30

/**
 * Factory Mode - Génération automatique du contenu via OpenAI
 * POST { taskId, instruction, agentRole }
 * → Génère le contenu, met à jour la tâche (output_content, status = 'done')
 *
 * Client Admin (Service Role) : bypass RLS, droits Super Admin pour écrire dans tasks.
 */
export async function POST(req: Request) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { taskId, instruction, agentRole } = body
    if (!taskId || typeof instruction !== "string") {
      return NextResponse.json(
        { error: "taskId and instruction are required" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
      },
    })

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, mission_id, agent_id, title, description")
      .eq("id", taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const prompt = String(instruction ?? task.description ?? task.title ?? "").trim() || task.title
    const role = String(agentRole ?? "Assistant polyvalent").trim()

    const systemPrompt = `Tu es un expert d'élite de l'agence virtuelle SantarAI. Tu produis des livrables B2B haut de gamme.

RÈGLES ABSOLUES :
1. AUCUN style conversationnel. Ne dis jamais bonjour, ni "Voici le travail", ni "J'ai préparé pour vous". Ne dis jamais "En tant qu'IA" ou t'excuser de manière robotique.
2. AUCUN emoji. Aucun point d'exclamation. Ponctuation neutre (point uniquement). Ton sec, direct, orienté résultat.
3. Ton livrable DOIT OBLIGATOIREMENT suivre cette structure Markdown stricte (mémo interne : Objet, Contexte, Action, Résultat) :

# [Titre professionnel du Livrable]

## Executive Summary
(1 phrase claire sur l'objectif accompli)

## Cœur du Livrable
(Le contenu principal généré : code, texte, plan, etc. — formaté proprement. Pour code : SQL, TSX, ou autre — livrable exploitable.)

## Recommandations Stratégiques
(1 ou 2 bullet points ultra-pertinents pour la suite)

4. Rôle applicatif : ${role}. Exécute la consigne en respectant scrupuleusement cette structure. Le livrable pourra être exporté en PDF (Bilan de Mission) sans retouche.
5. Ne coupe jamais ta réponse. Produis le livrable en entier jusqu'à la fin de la section Recommandations Stratégiques. Aucune limite de longueur imposée côté consigne.`

    const openai = new OpenAI({ apiKey: openaiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    })
    // Pas de stream : la réponse complète est disponible avant l'update Supabase
    const outputContent =
      completion.choices[0]?.message?.content?.trim() ??
      "(Aucun contenu généré)"

    const outputLen = outputContent.length
    const tail = outputContent.slice(-300)
    console.log("[execute] output_content length:", outputLen, "chars; tail (last 300):", tail)

    const isCode =
      /^```[\s\S]*?```/m.test(outputContent) ||
      outputContent.includes("def ") ||
      outputContent.includes("function ") ||
      outputContent.includes("const ") ||
      outputContent.includes("import ") ||
      outputContent.includes("SELECT ") ||
      outputContent.includes("CREATE TABLE") ||
      outputContent.includes("INSERT INTO") ||
      /\b\.(sql|tsx|ts|jsx)\b/.test(outputContent)

    const outputType = isCode ? "code" : "text"

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        output_content: outputContent,
        output_type: outputType,
        status: "done",
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    if (updateError) {
      console.error("[execute] Supabase update error:", updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    console.log("[execute] task updated successfully, taskId:", taskId)

    return NextResponse.json({
      success: true,
      output_content: outputContent,
      output_type: outputType,
      status: "done",
    })
  } catch (err) {
    console.error("Execute task error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}
