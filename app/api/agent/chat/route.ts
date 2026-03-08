import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import OpenAI from "openai"
import { getGuardrailSystemPrompt } from "@/lib/guardrails"
import { getEnterprisePromptBlock } from "@/lib/agentDirectives"

export const maxDuration = 30

const AGENT_PERSONAS: Record<string, string> = {
  "MKT-G": "Tu es GHOST, Copywriter Stratège. Ton froid, précis, orienté livrable. Tu rédiges du contenu percutant et peux proposer des tâches concrètes.",
  "MKT-P": "Tu es PIXEL, Designer Visuel. Ton professionnel, visuel, méticuleux. Images, maquettes, visuels. Tu peux créer des tâches design.",
  "MKT-S": "Tu es SUMO, Growth Hacker. Ton data-driven. Tu peux proposer des tâches de tests et déploiements.",
  "MKT-R": "Tu es RADAR, Analyste Marché. Ton analytique, factuel. Tu peux créer des tâches d'analyse ou de veille.",
  ZEN: "Tu es ZEN, Assistant Général. Ton calme, efficace. Tu aides à organiser le travail et peux ajouter des tâches au tableau.",
  GHOST: "Tu es GHOST, Copywriter Stratège. Ton froid, précis, orienté livrable. Tu rédiges du contenu percutant et peux proposer des tâches concrètes.",
  PIXEL: "Tu es PIXEL, Designer Visuel. Ton professionnel, visuel, méticuleux. Images, maquettes, visuels.",
  RADAR: "Tu es RADAR, Analyste Marché. Ton analytique, factuel. Tu peux créer des tâches d'analyse ou de veille.",
  SUMO: "Tu es SUMO, Growth Hacker. Ton data-driven.",
  MECHA: "Tu es MECHA, Debugger. Ton technique, méthodique. Tu corriges les erreurs et le code.",
  PYTHON_V1: "Tu es PYTHON V1, Scripter. Automatisation, scripts, API.",
  NINJA: "Tu es NINJA, Backend. Ton technique, direct. Tu traites les données.",
  SENSEI: "Tu es SENSEI, Tech Doc. Clarté technique, documentation.",
  ORACLE: "Tu es ORACLE, SQL. Requêtes, données, source de vérité.",
  RONIN: "Tu es RONIN, Prospection. Listes qualifiées, chasse aux prospects.",
  VIPER: "Tu es VIPER, Négociation. Closing, arguments, contre-offres.",
  YAKUZA: "Tu es YAKUZA, Rétention. Email, séquences, fidélisation.",
  SHOGUN: "Tu es SHOGUN, Stratège commercial. Stratégie d'offre, vision.",
  HAIKU: "Tu es HAIKU, Synthèse. Résumés, TL;DR, factuel.",
  BABEL: "Tu es BABEL, Traduction. Langues AR, FR, EN, ES, DE. Fidèle au sens.",
  KAMI: "Tu es KAMI, Analyste. KPIs, analyse données.",
  DATA_HAWK: "Tu es DATA HAWK, Extraction. Données, export, sources.",
  ABACUS: "Tu es ABACUS, Comptabilité. Tableaux, factures, export CSV.",
  DAIMYO: "Tu es DAIMYO, Juridique. Droit, contrats, conformité.",
  CRISIS: "Tu es CRISIS, Gestion de crise. Plans d'urgence, communication.",
  RECRUITER: "Tu es RECRUITER, RH. Recrutement, profils, recommandations.",
  STRATEGIST: "Tu es STRATEGIST, Conseil VC. Business model, investisseurs.",
  WATCHTOWER: "Tu es WATCHTOWER, Veille. Veille marché, rapport factuel.",
  KAGE: "Tu es KAGE, Clone. Agir comme le dirigeant. Analyse et conseil stratégique.",
  AKIRA: "Tu es AKIRA, Scripts vidéo. Formats courts pro, marketing B2B.",
  KATANA: "Tu es KATANA, Twitter/X pro. Threads, punchlines business.",
  KAIJU: "Tu es KAIJU, Newsletter. Campagnes, séquences, conversion.",
}

const SUGGEST_TASKS_SCHEMA = {
  type: "function" as const,
  function: {
    name: "suggest_tasks",
    description:
      "Proposer une liste de tâches concrètes à ajouter au Kanban. À utiliser quand l'utilisateur demande de planifier, d'organiser ou de proposer des tâches (ex. « propose 3 tâches », « prépare le plan »). Ne pas répondre avec une liste à puces textuelle.",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              type: { type: "string", enum: ["Marketing", "Design", "Tech", "Content"] },
              status: { type: "string", enum: ["todo", "in_progress"] },
            },
            required: ["title"],
          },
        },
      },
      required: ["tasks"],
    },
  },
}

const UPDATE_TASK_STATUS_SCHEMA = {
  type: "function" as const,
  function: {
    name: "update_task_status",
    description:
      "Déplacer une tâche existante (changer son statut). À utiliser en PRIORITÉ quand l'utilisateur dit « Commence X », « Lance X », « Fais X », « On y va pour X » : trouve la tâche dont le titre contient X et passe-la en 'in_progress'. Ne crée pas de doublon.",
    parameters: {
      type: "object",
      properties: {
        title_search: {
          type: "string",
          description: "Mot(s)-clé du titre de la tâche (ex: 'logo', 'identité visuelle'). Recherche floue, pas besoin du titre exact.",
        },
        new_status: {
          type: "string",
          enum: ["todo", "inprogress", "done"],
          description: "Nouveau statut : inprogress = En cours, done = Terminé, todo = À faire",
        },
      },
      required: ["title_search", "new_status"],
    },
  },
}

const ADD_WORK_TO_TASK_SCHEMA = {
  type: "function" as const,
  function: {
    name: "add_work_to_task",
    description:
      "Outil OBLIGATOIRE pour livrer le travail final (texte, code, rapport). ATTENTION : NE DOIT ÊTRE APPELÉ QU'UNE FOIS LE TRAVAIL TOTALEMENT RÉDIGÉ. Ne l'utilise JAMAIS pour simplement accuser réception d'une demande ou créer une tâche vide. Si le dossier de suivi n'existe pas, cet outil le créera automatiquement.",
    parameters: {
      type: "object",
      properties: {
        task_title: {
          type: "string",
          description: "Titre descriptif et professionnel du travail accompli (ex: 'Thread Twitter : Le Thé Bio'). Ne reprends JAMAIS le dernier message court de l'utilisateur comme titre.",
        },
        content: {
          type: "string",
          description: "OBLIGATOIRE. INJECTION INTÉGRALE REQUISE : Tu écris directement dans la base de données. Tu dois insérer ici la totalité de ton travail (pas de résumé, pas de placeholder). Écris en Markdown complet avec retours à la ligne (\\n). Ce paramètre représente le document physique livré au client.",
        },
        mark_as_done: {
          type: "boolean",
          description: "Si true, passe la tâche en 'done' (Terminé) après avoir ajouté le contenu.",
          default: false,
        },
        image_url: {
          type: "string",
          description: "OBLIGATOIRE pour logo/maquette : URL de l'image. Ne pas mettre l'URL dans content. Démo : https://placehold.co/600x400/1e1e1e/FFF?text=GENERE+PAR+IA&font=montserrat",
        },
      },
      required: ["task_title", "content"],
    },
  },
}

type ChatBody = {
  message: string
  missionId: string
  projectId?: string
  agentId?: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
}

export async function POST(req: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const openaiKey = process.env.OPENAI_API_KEY

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Supabase configuration missing (SUPABASE_SERVICE_ROLE_KEY or URL)" },
      { status: 500 }
    )
  }
  if (!openaiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is missing" },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const body = (await req.json()) as ChatBody
    console.log("👉 Chat Request for Mission:", body.missionId)
    const { message, missionId, projectId, agentId = "ZEN", history = [] } = body

    if (!message || typeof message !== "string" || !missionId) {
      return NextResponse.json(
        { error: "Missing or invalid 'message' or 'missionId' in body" },
        { status: 400 }
      )
    }

    const missionIdTrim = missionId.trim()
    const agentKey = (agentId ?? "ZEN").toString().trim().toUpperCase()

    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", body.missionId)
      .single()

    if (missionError || !mission) {
      console.error("❌ ERREUR CONTEXTE MISSION:", missionError)
      return NextResponse.json({
        reply: "Désolé Chef, je n'arrive pas à accéder au dossier de la mission (Erreur DB).",
      })
    }

    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("id, title, status")
      .eq("mission_id", missionIdTrim)
      .order("created_at", { ascending: false })
      .limit(20)

    const tasksList = Array.isArray(tasks) ? tasks : []
    const tasksContext =
      tasksList.length === 0
        ? "Aucune tâche pour l'instant."
        : tasksList.map((t) => `- [${t.status}] ${t.title}`).join("\n")

    const persona = AGENT_PERSONAS[agentKey] ?? AGENT_PERSONAS.ZEN
    const guardrail = getGuardrailSystemPrompt(agentId)
    const enterpriseBlock = getEnterprisePromptBlock(agentId)
    const systemPrompt = `${guardrail}${enterpriseBlock ? `${enterpriseBlock}\n\n` : ""}${persona}

Contexte de la mission :
- Titre : ${mission.title ?? "Sans titre"}
- Objectif : ${mission.result_snippet ?? "Non défini"}
- Statut : ${mission.status ?? "pending"}

Tâches actuelles du tableau :
${tasksContext}

ORDRE DES OPÉRATIONS (OBLIGATOIRE) :
- ÉTAPE 1 : Si la demande de l'utilisateur manque de contexte (ex: pas de sujet pour un post, un thread ou du code), TU DOIS LUI POSER LA QUESTION. Ne lance aucune action.
- ÉTAPE 2 et 3 : INTERDICTION DE BROUILLON : Ne rédige JAMAIS le livrable final sous forme de message texte dans le chat. LIVRAISON DIRECTE : Dès que tu as le contexte, tu dois IMMÉDIATEMENT appeler l'outil add_work_to_task et injecter L'INTÉGRALITÉ du texte/code que tu viens de concevoir DIRECTEMENT dans le paramètre content de l'outil. N'attends jamais l'approbation de l'utilisateur (ex: "ok") pour utiliser l'outil. Le travail doit être produit DANS l'outil, pas dans la conversation.

RÈGLES D'OR :
1) PRIORITÉ AU MOUVEMENT : Si l'utilisateur dit "Commence", "Lance", "Fais", "On y va", "Attaque" -> Ton PREMIER réflexe est de trouver une tâche existante (recherche par mot-clé) et d'appeler update_task_status avec new_status "inprogress". Ne crée pas une nouvelle tâche.
2) ANTI-DOUBLON : Avant de proposer des tâches (suggest_tasks), vérifie dans la liste des tâches actuelles ci-dessus si une tâche similaire existe déjà. Si elle existe, utilise update_task_status pour la déplacer au lieu d'en proposer une nouvelle.
3) SILENCE RADIO : Ne demande JAMAIS "Voulez-vous que je mette à jour ?" ou "Souhaites-tu que je...". FAIS-LE directement. Dis ensuite une phrase courte du type : "C'est fait, la tâche est en cours." ou "C'est parti, je bosse sur [X]."
4) TRAVAIL DANS LA CARTE : Quand tu travailles sur une tâche (ex: "Trouve 10 noms", "Donne 5 idées"), NE L'ÉCRIS PAS JUSTE DANS LE CHAT. UTILISE l'outil add_work_to_task pour enregistrer ton travail (liste, texte, idées, code) DIRECTEMENT dans la base de données de la tâche. Formate proprement en Markdown (titres, listes, gras). L'utilisateur verra le contenu en ouvrant la carte.
5) LIVRABLE FINAL OBLIGATOIRE : Dès que tu as toutes les informations et que tu génères le livrable final (code, texte, rapport, thread, liste), tu DOIS utiliser l'outil add_work_to_task. Si aucune tâche ne correspond, l'outil crée le contexte nécessaire. Ne donne jamais le livrable final en texte brut dans le chat sans appeler l'outil. Une réponse longue sans appel d'outil est interdite pour un livrable terminé.
6) IMAGE MAQUETTE (CRITIQUE) : Si l'utilisateur demande un logo, une image ou une maquette, TU DOIS OBLIGATOIREMENT remplir le champ image_url de l'outil add_work_to_task. Ne mets PAS le lien dans le texte content — mets-le dans image_url pour qu'il soit enregistré en base et affiché. Utilise cette URL de démo comme placeholder si tu n'as pas de vraie génération : https://placehold.co/600x400/1e1e1e/FFF?text=GENERE+PAR+IA&font=montserrat

7) NE JAMAIS EXPOSER LA TECHNIQUE : Si un outil système te renvoie une erreur ou un message technique (tâche manquante, échec, etc.), tu ne dois JAMAIS mentionner le nom d'un outil à l'utilisateur. Tu agis comme un cadre autonome : tu confirmes que le travail est enregistré ou que c'est fait, sans détailler les mécanismes internes.
8) APRÈS LIVRAISON : Le texte affiché dans la bulle de chat après l'utilisation de l'outil ne doit être qu'un résumé d'accompagnement (ex: "Le thread Twitter sur le thé bio a été rédigé avec succès. Vous pouvez le consulter dans le registre."). Pas de livrable en double dans le chat.

RÈGLES :
- Plan / étapes / "propose des tâches" -> suggest_tasks (liste interactive).
- Déplacer / commencer / lancer une tâche existante -> update_task_status (title_search + new_status).
- Livraison finale (texte, code, rapport) -> add_work_to_task uniquement.
- Sinon réponds en restant dans ton rôle.`

    const openai = new OpenAI({ apiKey: openaiKey })
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages,
      tools: [SUGGEST_TASKS_SCHEMA, UPDATE_TASK_STATUS_SCHEMA, ADD_WORK_TO_TASK_SCHEMA],
      tool_choice: "auto",
      temperature: 0.4,
      max_tokens: 4096,
    })

    const choice = completion.choices[0]
    const toolCalls = choice?.message?.tool_calls

    if (toolCalls?.length) {
      for (const call of toolCalls) {
        const fn = "function" in call ? (call as { function?: { name?: string; arguments?: string } }).function : undefined
        if (!fn) continue

        if (fn.name === "suggest_tasks") {
          let args: { tasks?: Array<{ title?: string; status?: string; type?: string }> } = {}
          try {
            args = JSON.parse(fn.arguments ?? "{}")
          } catch {
            args = { tasks: [] }
          }
          const tasks = Array.isArray(args.tasks)
            ? args.tasks.map((t) => ({
                title: String(t?.title ?? "Tâche").trim() || "Tâche",
                status: t?.status ?? "todo",
                type: t?.type ?? "",
              }))
            : []
          const contentText = choice?.message?.content ?? "Voici les tâches proposées."
          return NextResponse.json({
            type: "tool_use",
            toolName: "suggest_tasks",
            content: contentText,
            taskSuggestions: { tasks },
          })
        }
        if (fn.name === "update_task_status") {
          let args: { title_search?: string; new_status?: string } = {}
          try {
            args = JSON.parse(fn.arguments ?? "{}")
          } catch {
            args = {}
          }
          const titleSearch = String(args.title_search ?? "").trim()
          const newStatus = (args.new_status === "inprogress" ? "inprogress" : args.new_status === "done" ? "done" : "todo") as "todo" | "inprogress" | "done"
          if (!titleSearch) {
            return NextResponse.json({
              content: "Il me faut un mot-clé pour retrouver la tâche (ex: logo, brief).",
            })
          }
          const searchTerm = `%${titleSearch}%`
          const { data: candidates } = await supabaseAdmin
            .from("tasks")
            .select("id, title")
            .eq("mission_id", missionIdTrim)
            .ilike("title", searchTerm)
            .order("created_at", { ascending: false })
            .limit(5)
          const taskToUpdate = Array.isArray(candidates) && candidates.length > 0 ? candidates[0] : null
          if (!taskToUpdate?.id) {
            return NextResponse.json({
              content: "C'est noté.",
            })
          }
          const dbStatus = newStatus === "inprogress" ? "working" : newStatus === "done" ? "done" : "pending"
          const { error: updateErr } = await supabaseAdmin
            .from("tasks")
            .update({ status: dbStatus })
            .eq("id", taskToUpdate.id)
          if (updateErr) {
            console.error("Agent chat: update_task_status error", JSON.stringify(updateErr, null, 2))
            return NextResponse.json({
              content: "Impossible de mettre à jour la tâche.",
            })
          }
          const missionIdForLink = missionIdTrim
          const { data: missionRow } = await supabaseAdmin.from("missions").select("id, status").eq("id", missionIdForLink).single()
          if (missionRow) {
            let newMissionStatus: string | undefined
            if (dbStatus === "working") newMissionStatus = "in_progress"
            else if (dbStatus === "done") {
              const { data: missionTasks } = await supabaseAdmin.from("tasks").select("status").eq("mission_id", missionIdForLink)
              const allDone = Array.isArray(missionTasks) && missionTasks.length > 0 && missionTasks.every((t: { status: string }) => t.status === "done")
              if (allDone) newMissionStatus = "completed"
            }
            if (newMissionStatus && newMissionStatus !== missionRow.status) {
              await supabaseAdmin.from("missions").update({ status: newMissionStatus }).eq("id", missionIdForLink)
            }
          }
          const taskTitle = (taskToUpdate as { title?: string }).title ?? titleSearch
          return NextResponse.json({
            content: newStatus === "inprogress"
              ? `C'est parti, je bosse sur ${taskTitle}.`
              : newStatus === "done"
                ? `C'est fait, « ${taskTitle} » est marquée terminée.`
                : `La tâche « ${taskTitle} » est repassée en à faire.`,
            taskUpdated: true,
            taskTitle,
            taskId: taskToUpdate.id,
          })
        }
        if (fn.name === "add_work_to_task") {
          let args: { task_title?: string; content?: string; mark_as_done?: boolean; image_url?: string; imageUrl?: string } = {}
          try {
            args = JSON.parse(fn.arguments ?? "{}")
          } catch {
            args = {}
          }
          const taskTitleSearch = String(args.task_title ?? "").trim()
          const content = String(args.content ?? "").trim()
          console.log("[TOOL EXECUTED] Payload reçu :", { task_title: taskTitleSearch, content_length: content?.length })
          const markAsDone = Boolean(args.mark_as_done)
          const imageUrlRaw = args.image_url ?? args.imageUrl
          const imageUrl = typeof imageUrlRaw === "string" ? imageUrlRaw.trim() : ""
          if (imageUrl) console.log("📸 UPDATE IMAGE:", imageUrl)
          if (!taskTitleSearch) {
            return NextResponse.json({
              content: "Il me faut le titre (ou mot-clé) de la tâche.",
            })
          }
          if (!content) {
            return NextResponse.json({
              content: "Erreur : le paramètre content est vide. Tu dois fournir le texte intégral.",
            })
          }
          if (content.length < 50) {
            return NextResponse.json({
              content: "Erreur : le livrable fait moins de 50 caractères. Tu dois fournir le texte intégral dans le paramètre content. Aucune mission ne doit être clôturée avec un livrable aussi court.",
            })
          }
          const searchTerm = `%${taskTitleSearch}%`
          let { data: candidates } = await supabaseAdmin
            .from("tasks")
            .select("id, title, description, output_content")
            .eq("mission_id", missionIdTrim)
            .ilike("title", searchTerm)
            .order("created_at", { ascending: false })
            .limit(5)
          let taskToUpdate = Array.isArray(candidates) && candidates.length > 0 ? candidates[0] : null

          if (!taskToUpdate?.id) {
            const agentIdForTask = (mission.agent_id ?? agentKey).toString().trim() || "ZEN"
            const isCode =
              /^```[\s\S]*?```/m.test(content) ||
              content.includes("SELECT ") ||
              content.includes("CREATE ") ||
              content.includes("function ") ||
              content.includes("const ") ||
              content.includes("import ") ||
              content.includes(".tsx") ||
              content.includes(".sql")
            const { data: inserted, error: insertErr } = await supabaseAdmin
              .from("tasks")
              .insert({
                mission_id: missionIdTrim,
                agent_id: agentIdForTask,
                title: taskTitleSearch.slice(0, 500),
                description: content,
                output_content: content,
                output_type: isCode ? "code" : "text",
                status: "done",
                ...(imageUrl ? { image_url: imageUrl } : {}),
              })
              .select("id, title")
              .single()
            if (insertErr || !inserted?.id) {
              console.error("Agent chat: add_work_to_task auto-insert error", JSON.stringify(insertErr, null, 2))
              return NextResponse.json({
                content: "C'est enregistré. Le livrable est disponible dans le Registre.",
                workAdded: true,
                taskTitle: taskTitleSearch,
                taskId: inserted?.id ?? null,
              })
            }
            const estimatedCost = Math.ceil(content.length / 4) + 150
            await supabaseAdmin.from("missions").update({
              status: "completed",
              result_snippet: content,
              cost: estimatedCost,
            }).eq("id", missionIdTrim)
            return NextResponse.json({
              workAdded: true,
              resultSnippet: content,
              calculatedCost: estimatedCost,
              content: "C'est fait. Le travail est enregistré et la mission est clôturée.",
              taskTitle: (inserted as { title?: string }).title ?? taskTitleSearch,
              taskId: inserted.id,
            })
          }

          const existingDescription = String((taskToUpdate as { description?: string }).description ?? "").trim()
          const newDescription = existingDescription
            ? `${existingDescription}\n\n---\n\n${content}`
            : content
          const existingOutput = String((taskToUpdate as { output_content?: string }).output_content ?? "").trim()
          const newOutputContent = existingOutput
            ? `${existingOutput}\n\n---\n\n${content}`
            : content
          const isCode =
            /^```[\s\S]*?```/m.test(content) ||
            content.includes("SELECT ") ||
            content.includes("CREATE ") ||
            content.includes("function ") ||
            content.includes("const ") ||
            content.includes("import ") ||
            content.includes(".tsx") ||
            content.includes(".sql")
          const updatePayload: {
            description: string
            output_content: string
            output_type: "text" | "code"
            status?: string
            image_url?: string
          } = { description: newDescription, output_content: newOutputContent, output_type: isCode ? "code" : "text" }
          if (markAsDone) updatePayload.status = "done"
          if (imageUrl) updatePayload.image_url = imageUrl
          console.log("[agent/chat] add_work_to_task output_content length:", newOutputContent.length, "chars; taskId:", taskToUpdate.id)
          const { error: updateErr } = await supabaseAdmin
            .from("tasks")
            .update(updatePayload)
            .eq("id", taskToUpdate.id)
          if (updateErr) {
            console.error("Agent chat: add_work_to_task error", JSON.stringify(updateErr, null, 2))
            return NextResponse.json({
              content: "Impossible d'enregistrer le contenu dans la tâche (colonne description ?).",
            })
          }
          let missionCost: number | undefined
          if (markAsDone) {
            const { data: missionRow } = await supabaseAdmin.from("missions").select("id, status").eq("id", missionIdTrim).single()
            if (missionRow) {
              const { data: missionTasks } = await supabaseAdmin.from("tasks").select("status").eq("mission_id", missionIdTrim)
              const allDone = Array.isArray(missionTasks) && missionTasks.length > 0 && missionTasks.every((t: { status: string }) => t.status === "done")
              if (allDone) {
                missionCost = Math.ceil(content.length / 4) + 150
                await supabaseAdmin.from("missions").update({
                  status: "completed",
                  result_snippet: content,
                  cost: missionCost,
                }).eq("id", missionIdTrim)
              }
            }
          }
          const displayTitle = (taskToUpdate as { title?: string }).title ?? taskTitleSearch
          return NextResponse.json({
            workAdded: true,
            resultSnippet: content,
            ...(missionCost != null ? { calculatedCost: missionCost } : {}),
            content: markAsDone
              ? `C'est fait. J'ai enregistré le travail dans la tâche « ${displayTitle} » et l'ai marquée terminée.`
              : `C'est enregistré dans la tâche « ${displayTitle} ». Tu peux ouvrir la carte pour voir le détail.`,
            taskTitle: displayTitle,
            taskId: taskToUpdate.id,
          })
        }
      }
    }

    const content = choice?.message?.content ?? "Je n'ai pas de réponse à te donner pour le moment."
    return NextResponse.json({ content, taskCreated: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("Agent chat error:", err)
    return NextResponse.json({ error: message, content: null }, { status: 500 })
  }
}
