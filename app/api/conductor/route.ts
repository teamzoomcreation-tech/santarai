/**
 * Conductor - Orchestrateur intelligent.
 * Crée des projets, missions et tâches à partir d'un objectif.
 * Facture les agents recrutés automatiquement (auto-fill).
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import { MARKET_CATALOG } from "@/lib/catalog"
import { getTreasury, debitTreasury } from "@/lib/supabase/user-balance"

export const maxDuration = 30

const AGENT_COST = 15_000 // TK par agent recruté (fallback si non trouvé au catalogue)

function buildConductorPrompt(myAgents: { id: string; name: string; role: string }[], resources: { title?: string; file_type?: string; file_url?: string }[]) {
  const agentsJson = JSON.stringify(myAgents)
  const knowledgeBaseSection =
    resources.length > 0
      ? `---
BASE DE CONNAISSANCES (LIBRARY):
Voici les fichiers disponibles dans l'entreprise :
${resources.map((r) => `- [${r.file_type || "fichier"}] ${r.title}`).join("\n")}

INSTRUCTION DE FILTRAGE SÉMANTIQUE (CRITIQUE) :
1. Analyse le titre des fichiers par rapport à l'objectif du projet.
2. Si un fichier est PERTINENT (ex: 'Charte Graphique' pour un logo), tu DOIS le mentionner dans la description de la tâche.
   -> Format : "Se référer au document : [Nom_du_fichier]"
3. Si un fichier est HORS-SUJET (ex: 'Recette Cuisine' pour un projet Tech), IGNORE-LE totalement. Ne le mentionne pas.
---
`
      : ""
  const roleMappingRule = `ASSOCIATION STRICTE OBJECTIF → REQUIRED_ROLES (À RESPECTER IMPÉRATIVEMENT) :
- "Juridique", "Legal", "Contrat", "Audit juridique", "Loi", "Conformité", "RGPD", "Droit" → required_roles: ["LEGAL"] (agent DAIMYO, Elite)
- "Marketing", "SEO", "Post", "Vente", "LinkedIn", "TikTok", "Newsletter", "Pub", "Campagne" → required_roles: ["MARKETING"] (GHOST, AKIRA, RADAR)
- "Code", "Python", "App", "Debug", "API", "Backend", "SQL", "Tech", "Dev" → required_roles: ["TECH"] (MECHA, NINJA, ORACLE)
- "Admin", "Support", "Email", "Planning", "Résumé", "Traduction", "Traducteur" → required_roles: ["ADMIN"] (ZEN, HAIKU, BABEL)
- "Data", "Excel", "KPI", "Analytique", "Chiffres" → required_roles: ["DATA"] (ABACUS, KAMI)
- "Vente", "Prospection", "Closing", "Négociation", "Dossier commercial" → required_roles: ["SALES"] (RONIN, VIPER, SUMO)
- LEGAL utilise l'agent DAIMYO (catégorie ELITE). Ne confonds JAMAIS "Audit Juridique" avec ADMIN (ZEN).
`
  const strictRule = `RÈGLE D'ASSIGNATION STRICTE (CRITIQUE — À RESPECTER IMPÉRATIVEMENT) :
- Tu ne dois utiliser QUE les agents présents dans la liste fournie myAgents. Si aucun agent ne correspond à une mission, mets assigned_agent_id: null.
- ATTENTION : Tu dois retourner EXACTEMENT l'ID technique (champ "id") de l'agent fourni dans la liste myAgents. Ne modifie pas la casse, n'utilise JAMAIS le nom d'affichage ("name") à la place de l'id. Copie l'id tel quel.
- Noms INTERDITS (hallucinations) : "Sophie", "Max", "Pixel" (si absent), "Redac", "Client Keeper", etc.
- Chaque "assigned_agent_id" doit être SOIT l'id (UUID) présent dans la liste ci-dessus, SOIT null. Jamais "GHOST", "ghost" ou un nom — uniquement l'id.
`
  return `Tu es l'Orchestrateur SantarAI (Conductor). Tu réponds UNIQUEMENT par un objet JSON valide, sans texte avant ou après.
${knowledgeBaseSection}
${roleMappingRule}

INVENTAIRE EXACT DES AGENTS DISPONIBLES (achetés par le client) :
${agentsJson}

${strictRule}

STRUCTURE OBLIGATOIRE :
{
  "name": "Nom du projet",
  "type": "Marketing",
  "required_roles": ["TECH", "MARKETING"],
  "description": "Courte description",
  "missions": [
    { "title": "Titre", "assigned_agent_id": "<UUID ou null>", "description": "Ce que l'agent doit faire", "estimatedTokens": 1000 }
  ]
}
- Réponds UNIQUEMENT avec ce JSON, pas de markdown, pas de bloc code.
`
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "FATAL: SUPABASE_SERVICE_ROLE_KEY or URL is missing in .env.local" },
      { status: 500 }
    )
  }
  if (!openaiKey) {
    return NextResponse.json({ error: "FATAL: OPENAI_API_KEY is missing" }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const body = await req.json()
    const mode = body.mode === "execute" ? "execute" : "simulate"
    const prompt = body.prompt ?? body.objective
    const userId = body.userId
    const plan = body.plan
    const selectedAgentIds = Array.isArray(body.selectedAgentIds) ? body.selectedAgentIds.map((id: unknown) => String(id).trim().toLowerCase()) : null

    if (mode === "execute") {
      if (!plan || typeof plan !== "object") {
        return NextResponse.json({ error: "Missing or invalid 'plan' in body (required for mode: execute)" }, { status: 400 })
      }
      if (!userId || typeof userId !== "string") {
        return NextResponse.json({ error: "Missing or invalid 'userId' in body (required)" }, { status: 400 })
      }
    } else {
      if (!prompt || typeof prompt !== "string") {
        return NextResponse.json({ error: "Missing or invalid 'prompt' or 'objective' in body" }, { status: 400 })
      }
      if (!userId || typeof userId !== "string") {
        return NextResponse.json({ error: "Missing or invalid 'userId' in body (required)" }, { status: 400 })
      }
    }

    const [agentsResult, resourcesResult, userAgentsResult] = await Promise.all([
      supabaseAdmin.from("agents").select("id, name, role").eq("user_id", userId),
      supabaseAdmin.from("resources").select("title, file_type, file_url").eq("user_id", userId),
      supabaseAdmin.from("user_agents").select("agent_id").eq("user_id", userId),
    ])

    const agents = agentsResult.data ?? []
    const resources = resourcesResult.data ?? []
    const fromUserAgents = (userAgentsResult.data ?? [])
      .map((r) => String(r.agent_id).trim().toLowerCase())
      .filter(Boolean)
    const fromAgentsTable = agents.flatMap((a) => {
      const catalog = MARKET_CATALOG.find((c) => c.name.toUpperCase() === (a.name ?? "").toUpperCase())
      return catalog ? [catalog.id.toLowerCase()] : []
    })
    const ownedAgentIds = new Set<string>([...fromUserAgents, ...fromAgentsTable])
    const agentById = Object.fromEntries(agents.map((a) => [a.id, a]))
    const agentByNameToRow = Object.fromEntries(
      agents.map((a) => [(a.name ?? "").toUpperCase(), a])
    )

    let projectData: Record<string, unknown>
    if (mode === "execute") {
      projectData = plan
    } else {
      const systemPrompt = buildConductorPrompt(agents, resources)
      const openai = new OpenAI({ apiKey: openaiKey })
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      })
      let content = (completion.choices[0]?.message?.content ?? "{}").replace(/```json/gi, "").replace(/```/g, "").trim()
      const si = content.indexOf("{")
      const ei = content.lastIndexOf("}")
      if (si >= 0 && ei > si) content = content.substring(si, ei + 1)
      projectData = JSON.parse(content)
    }

    const requiredRolesRaw = projectData.required_roles ?? (projectData.type ? [projectData.type] : [])
    const validCategories = ["MARKETING", "TECH", "SALES", "DATA", "ADMIN", "ELITE", "LEGAL"]
    const requiredRoles = (Array.isArray(requiredRolesRaw) ? requiredRolesRaw : [String(requiredRolesRaw)])
      .map((r) => String(r).toUpperCase())
      .filter((r) => validCategories.includes(r))
    if (requiredRoles.length === 0) requiredRoles.push("MARKETING")

    let missionsToProcess = (projectData.missions ?? []) as Record<string, unknown>[]
    if (!Array.isArray(missionsToProcess)) missionsToProcess = []

    const sanitizedMissions = missionsToProcess.map((m) => {
      let rawAgentId = (m.assigned_agent_id ?? m.agentId ?? null) as string | null
      if (rawAgentId === "null" || rawAgentId === "" || (typeof rawAgentId !== "string" && rawAgentId != null)) rawAgentId = null
      let finalAgentId: string | null = rawAgentId && agents.find((a) => a.id === rawAgentId) ? rawAgentId : null
      if (!finalAgentId && rawAgentId) {
        const byName = agents.find((a) => (a.name ?? "").toUpperCase() === String(rawAgentId).trim().toUpperCase())
        if (byName) finalAgentId = byName.id
      }
      const agentName = finalAgentId ? (agentById[finalAgentId]?.name ?? (m.agent_name as string) ?? null) : (m.agent_name as string) ?? null
      const cost = Math.max(0, Number(m.estimatedTokens ?? m.cost ?? 0) || 0)
      return { ...m, assigned_agent_id: finalAgentId, agent_name: agentName, cost }
    })

    const userAgentCategories = new Set(
      agents.flatMap((a) => {
        const catalog = MARKET_CATALOG.find((c) => c.name.toUpperCase() === (a.name ?? "").toUpperCase())
        if (!catalog) return []
        const cats = [catalog.category]
        if (catalog.name === "DAIMYO") cats.push("LEGAL" as any)
        return cats
      })
    )
    const missingRoles = requiredRoles.filter((r) => !userAgentCategories.has(r as any))

    const buildPlanPayload = () => {
      const teamNames = [...new Set(sanitizedMissions.map((m) => m.agent_name).filter(Boolean))] as string[]
      const totalCost = sanitizedMissions.reduce((s, m) => s + (m.cost ?? 0), 0)
      return {
        objective: typeof prompt === "string" ? prompt : (projectData.objective as string) ?? "",
        name: String(projectData.name ?? projectData.projectName ?? projectData.title ?? "Nouveau Projet").trim(),
        description: String(projectData.description ?? projectData.squadName ?? "Généré par SantarAI").trim(),
        type: projectData.type,
        required_roles: projectData.required_roles,
        missions: sanitizedMissions.map((m: any) => ({
          title: m.title,
          assigned_agent_id: m.assigned_agent_id,
          agent_name: m.agent_name,
          description: m.description ?? m.result_snippet,
          result_snippet: m.description ?? m.result_snippet,
          estimatedTokens: m.cost,
          cost: m.cost,
        })),
        team: teamNames,
        totalCost,
        dueDate: projectData.dueDate ?? projectData.due_date,
      }
    }

    if (missingRoles.length > 0) {
      const LEGAL_AGENT_COST = 9000
      const estimatedCost = missingRoles.reduce((sum, role) => {
        if (role === "LEGAL") return sum + LEGAL_AGENT_COST
        const cheapest = MARKET_CATALOG.filter((a) => a.category === role).sort((a, b) => a.monthlyCost - b.monthlyCost)[0]
        return sum + (cheapest?.monthlyCost ?? 5000)
      }, 0)
      return NextResponse.json({
        status: "MISSING_RESOURCES",
        missing_roles: missingRoles,
        estimated_cost: estimatedCost,
        plan: buildPlanPayload(),
        message: `Agents requis : ${missingRoles.join(", ")}`,
      })
    }

    if (mode === "simulate") {
      return NextResponse.json({
        status: "SIMULATED",
        plan: buildPlanPayload(),
      })
    }

    // ——— EXECUTE : 1. INVENTAIRE — Comparer plan vs user_agents (IDs normalisés) ; si selectedAgentIds fourni, l'utiliser
    const validCatalogIds = new Set(MARKET_CATALOG.map((c) => c.id.toLowerCase()))
    const catalogIdsFromPlan = new Set<string>()
    for (const m of sanitizedMissions) {
      const name = (m.agent_name ?? null) as string | null
      if (!name) continue
      const catalogAgent = MARKET_CATALOG.find((c) => c.name.toUpperCase() === String(name).trim().toUpperCase())
      if (catalogAgent) catalogIdsFromPlan.add(catalogAgent.id.toLowerCase())
    }

    let nouveauxAgentsARecruterSet: Set<string>
    if (selectedAgentIds?.length) {
      const idsToRecruit = selectedAgentIds
        .filter((idLower) => validCatalogIds.has(idLower) && !ownedAgentIds.has(idLower))
        .map((idLower) => MARKET_CATALOG.find((c) => c.id.toLowerCase() === idLower)?.id)
        .filter((id): id is string => !!id)
      nouveauxAgentsARecruterSet = new Set(idsToRecruit)
    } else {
      nouveauxAgentsARecruterSet = new Set<string>()
      for (const idLower of catalogIdsFromPlan) {
        if (!validCatalogIds.has(idLower) || ownedAgentIds.has(idLower)) continue
        const canonical = MARKET_CATALOG.find((c) => c.id.toLowerCase() === idLower)
        if (canonical) nouveauxAgentsARecruterSet.add(canonical.id)
      }
    }
    const nouveauxAgentsARecruter = [...nouveauxAgentsARecruterSet]

    // ——— 2. FACTURATION — Débit recrutement (coût catalogue par agent) + coût opérationnel des missions (user_balance)
    const totalAgentCost = nouveauxAgentsARecruter.reduce((sum, catalogId) => {
      const entry = MARKET_CATALOG.find((c) => c.id.toLowerCase() === catalogId.toLowerCase())
      return sum + (entry?.monthlyCost ?? AGENT_COST)
    }, 0)
    const missionCost =
      Math.max(0, Number(projectData.totalCost ?? 0) || 0) ||
      sanitizedMissions.reduce((s, m) => s + Math.max(0, Number(m.estimatedTokens ?? m.cost ?? 0) || 0), 0)
    const totalToDebit = totalAgentCost + missionCost

    console.log("💰 TOTAL À DÉBITER :", totalToDebit, "(agents:", totalAgentCost, "+ missions:", missionCost, ")")

    if (totalToDebit > 0) {
      const treasury = await getTreasury(supabaseAdmin, userId)
      if (treasury < totalToDebit) {
        return NextResponse.json(
          { error: "Fonds insuffisants pour le déploiement (recrutement + coût des missions)." },
          { status: 402 }
        )
      }

      const debitResult = await debitTreasury(supabaseAdmin, userId, totalToDebit)
      if (!debitResult.ok) {
        return NextResponse.json(
          { error: debitResult.error ?? "Fonds insuffisants pour le déploiement." },
          { status: 402 }
        )
      }
    }

    // ——— 3. RECRUTEMENT SÉLECTIF — Assigner agents existants, insérer uniquement les nouveaux
    let agentsMut = [...agents]
    const agentIds = new Set(agents.map((a) => a.id))
    const sanitizedMut = [...sanitizedMissions]

    for (let i = 0; i < sanitizedMut.length; i++) {
      const m = sanitizedMut[i]
      const name = (m.agent_name ?? null) as string | null
      if (!name) continue

      const catalogAgent = MARKET_CATALOG.find((c) => c.name.toUpperCase() === String(name).toUpperCase())
      if (!catalogAgent) continue

      const catalogIdLower = catalogAgent.id.toLowerCase()
      const hasInUserAgents = ownedAgentIds.has(catalogIdLower)
      const existingRow = agentByNameToRow[catalogAgent.name.toUpperCase()]
      const hasInAgents = !!existingRow || agentsMut.some((a) => (a.name ?? "").toUpperCase() === catalogAgent.name.toUpperCase())
      const isDejaPossede = hasInUserAgents || hasInAgents

      if (isDejaPossede) {
        const row = existingRow ?? agentsMut.find((a) => (a.name ?? "").toUpperCase() === catalogAgent.name.toUpperCase())
        if (row && !m.assigned_agent_id) {
          sanitizedMut[i] = { ...m, assigned_agent_id: row.id, agent_name: catalogAgent.name }
        }
        continue
      }

      if (m.assigned_agent_id) continue

      const { data: inserted } = await supabaseAdmin
        .from("agents")
        .insert({
          user_id: userId,
          name: catalogAgent.name,
          role: catalogAgent.role,
          status: "idle",
          avatar_color: { MARKETING: "pink", TECH: "blue", SALES: "green", ADMIN: "slate", DATA: "cyan", ELITE: "yellow" }[catalogAgent.category] ?? "cyan",
          tasks_completed: 0,
          efficiency: 85,
        })
        .select("id")
        .single()

      if (inserted?.id) {
        agentsMut.push({ id: inserted.id, name: catalogAgent.name, role: catalogAgent.role })
        agentIds.add(inserted.id)
        agentByNameToRow[catalogAgent.name.toUpperCase()] = { id: inserted.id, name: catalogAgent.name, role: catalogAgent.role }
        sanitizedMut[i] = { ...m, assigned_agent_id: inserted.id, agent_name: catalogAgent.name }
      }
    }

    const projectName = String(projectData.name ?? projectData.projectName ?? projectData.title ?? "Nouveau Projet").trim() || "Nouveau Projet"
    const description = String(projectData.description ?? projectData.squadName ?? "Généré par SantarAI").trim() || null
    const defaultDueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const dueDate = (projectData.dueDate ?? projectData.due_date ?? defaultDueDate) as string

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert({
        user_id: userId,
        name: projectName,
        description: description ?? null,
        status: "active",
        progress: 0,
        due_date: dueDate ?? null,
      })
      .select("id")
      .single()

    if (projectError || !project?.id) {
      if (totalToDebit > 0) {
        const current = await getTreasury(supabaseAdmin, userId)
        await supabaseAdmin.from("user_balance").upsert(
          { user_id: userId, treasury: current + totalToDebit, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
      }
      return NextResponse.json(
        { error: `Échec création projet: ${projectError?.message ?? "Erreur inconnue"}` },
        { status: 500 }
      )
    }

    const missionsToInsert = sanitizedMut.map((m) => ({
      user_id: userId,
      project_id: project.id,
      agent_id: m.assigned_agent_id ?? null,
      agent_name: m.agent_name ?? null,
      title: String(m.title || "Mission sans titre").trim(),
      status: "pending",
      cost: Number.isNaN(m.cost) ? 0 : m.cost,
      result_snippet: String(m.description ?? m.result_snippet ?? "Pas de description").trim(),
    }))

    let missionsData: { id: string; title: string | null; agent_id: string | null }[] | null = null
    let missionsError: { message: string } | null = null
    try {
      const insertResult = await supabaseAdmin.from("missions").insert(missionsToInsert).select("id, title, agent_id")
      missionsData = insertResult.data
      missionsError = insertResult.error
    } catch (error) {
      console.error("CRASH INSERTION MISSION :", error)
      if (totalToDebit > 0) {
        const current = await getTreasury(supabaseAdmin, userId)
        await supabaseAdmin.from("user_balance").upsert(
          { user_id: userId, treasury: current + totalToDebit, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
      }
      return NextResponse.json(
        { error: `Insertion missions échouée: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      )
    }
    if (missionsError) {
      if (totalToDebit > 0) {
        const current = await getTreasury(supabaseAdmin, userId)
        await supabaseAdmin.from("user_balance").upsert(
          { user_id: userId, treasury: current + totalToDebit, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
      }
      return NextResponse.json({ error: `Insertion missions échouée: ${missionsError.message}` }, { status: 500 })
    }
    const insertedMissions = missionsData ?? []

    const ORPHAN_PLACEHOLDER = "ZEN"
    const tasksToInsert = insertedMissions.map((mission, idx) => {
      const missionData = missionsToInsert[idx]
      const agentExists = mission.agent_id ? agentsMut.find((a) => a.id === mission.agent_id) : null
      const finalAgentId = agentExists ? agentExists.id : ORPHAN_PLACEHOLDER
      return {
        mission_id: mission.id,
        agent_id: finalAgentId,
        title: mission.title || "Tâche",
        description: missionData?.result_snippet ?? null,
        status: "pending",
      }
    })
    if (tasksToInsert.length > 0) {
      await supabaseAdmin.from("tasks").insert(tasksToInsert)
    }

    // Insert dans user_agents UNIQUEMENT : user_id + agent_id (même structure que recrutement individuel)
    if (nouveauxAgentsARecruter.length > 0) {
      const rows: { user_id: string; agent_id: string }[] = nouveauxAgentsARecruter.map((agent_id) => ({
        user_id: userId,
        agent_id: String(agent_id),
      }))
      const { error: uaError } = await supabaseAdmin.from("user_agents").insert(rows)
      if (uaError) {
        if (uaError.code === "23505") {
          for (const row of rows) {
            const { error: singleErr } = await supabaseAdmin.from("user_agents").insert(row)
            if (singleErr && singleErr.code !== "23505") {
              console.error("Erreur complète Supabase (user_agents insert):", JSON.stringify(singleErr, null, 2))
              if (totalToDebit > 0) {
                const current = await getTreasury(supabaseAdmin, userId)
                await supabaseAdmin.from("user_balance").upsert(
                  { user_id: userId, treasury: current + totalToDebit, updated_at: new Date().toISOString() },
                  { onConflict: "user_id" }
                )
              }
              return NextResponse.json(
                { error: `Insert user_agents échoué: ${singleErr.message} (code: ${singleErr.code ?? "?"})` },
                { status: 400 }
              )
            }
          }
        } else {
          console.error("Erreur complète Supabase (user_agents insert):", JSON.stringify(uaError, null, 2))
          if (totalToDebit > 0) {
            const current = await getTreasury(supabaseAdmin, userId)
            await supabaseAdmin.from("user_balance").upsert(
              { user_id: userId, treasury: current + totalToDebit, updated_at: new Date().toISOString() },
              { onConflict: "user_id" }
            )
          }
          return NextResponse.json(
            { error: `Insert user_agents échoué: ${uaError.message} (code: ${uaError.code ?? "?"})` },
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json({
      status: "CREATED",
      success: true,
      projectId: project.id,
      debitedAmount: totalToDebit,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("Conductor error:", error)
    console.error("Erreur complète Supabase :", JSON.stringify(error, null, 2))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
