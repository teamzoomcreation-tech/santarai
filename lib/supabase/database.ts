import { supabase } from "./client"
import type { Agent } from "@/components/dashboard/my-agents-view"
import { MARKET_CATALOG } from "@/lib/catalog"
import { MARKET_AGENTS } from "@/data/marketAgents"

// Type helper pour les projets
interface Project {
  id: string
  name: string
  progress: number
  dueDate: string
  client?: string
  description?: string
  totalTasks?: number
  completedTasks?: number
  assignedAgents: Array<{
    id: string
    name: string
    avatar: string
    color: string
  }>
}

// Agents - Inventaire utilisateur UNIQUEMENT (user_agents, jamais le catalogue)
// Requiert: CREATE TABLE user_agents (user_id UUID, agent_id TEXT, PRIMARY KEY (user_id, agent_id));
// Si user_agents vide → []
function mapRowToAgent(row: {
  agent?: { id: string; name: string; role: string; status?: string; avatar_color?: string; tasks_completed?: number; efficiency?: number } | null
  agent_id?: string
}): Agent | null {
  const a = row.agent
  if (a && a.id && a.name && a.role) {
    return {
      id: a.id,
      name: a.name,
      role: a.role,
      status: (a.status as "active" | "idle" | "thinking") || "idle",
      avatar: { color: a.avatar_color || "cyan" },
      tasksCompleted: a.tasks_completed || 0,
      efficiency: a.efficiency || 85,
    }
  }
  if (row.agent_id) {
    const c = [...MARKET_CATALOG, ...(MARKET_AGENTS || [])].find(
      (x) => x.id?.toLowerCase() === String(row.agent_id).toLowerCase() || x.name?.toUpperCase() === String(row.agent_id).toUpperCase()
    )
    if (c) {
      return {
        id: c.id,
        name: c.name,
        role: c.role,
        status: "idle" as const,
        avatar: { color: "cyan" as const },
        tasksCompleted: 0,
        efficiency: 85,
      }
    }
  }
  return null
}

// user_agents : uniquement user_id + agent_id (catalog id). Pas de join pour éviter 400 si schéma diffère.
export async function getAgents(userId: string): Promise<Agent[]> {
  if (!userId) return []
  try {
    const { data: userAgents, error } = await supabase
      .from("user_agents")
      .select("agent_id")
      .eq("user_id", userId)

    if (error) {
      console.warn("getAgents user_agents:", error.message)
      return []
    }

    if (!userAgents?.length) return []
    return userAgents
      .map((r: { agent_id: string }) => mapRowToAgent({ agent_id: r.agent_id }))
      .filter((a): a is Agent => a != null)
  } catch (e) {
    console.error("getAgents:", e)
    return []
  }
}

export async function addAgent(userId: string, agent: Omit<Agent, "id">): Promise<Agent> {
  try {
    // Vérification que tous les champs requis sont présents
    if (!userId || !agent.name || !agent.role) {
      throw new Error("Champs manquants: user_id, name ou role")
    }

    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: userId,
        name: agent.name,
        role: agent.role,
        status: agent.status || "idle", // "idle" = "En attente"
        avatar_color: agent.avatar?.color || "cyan",
        tasks_completed: agent.tasksCompleted || 0,
        efficiency: agent.efficiency || 85,
      })
      .select()
      .single()

    if (error) {
      // Gestion d'erreur améliorée avec JSON.stringify pour éviter les objets vides {}
      console.error("Erreur Supabase détaillée:", JSON.stringify(error, null, 2))
      console.error("Error adding agent to public.agents:", error)
      throw error
    }

    if (!data) {
      throw new Error("No data returned from insert")
    }

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      status: data.status || "idle",
      avatar: {
        color: data.avatar_color || "cyan",
      },
      tasksCompleted: data.tasks_completed || 0,
      efficiency: data.efficiency || 85,
    }
  } catch (error: any) {
    // Gestion d'erreur améliorée avec JSON.stringify pour éviter les objets vides {}
    console.error("Erreur Supabase détaillée:", JSON.stringify(error, null, 2))
    console.error("Failed to add agent:", error)
    throw error
  }
}

export async function removeAgent(agentId: string, userId?: string): Promise<void> {
  if (!agentId) return
  if (userId) {
    const { error: uaError } = await supabase
      .from("user_agents")
      .delete()
      .match({ user_id: userId, agent_id: agentId })
    if (!uaError) return
  }
  const { error } = await supabase.from("agents").delete().eq("id", agentId)
  if (error) {
    console.error("Error removing agent:", error)
    throw error
  }
}

// Projects - Table: public.projects
// Colonnes réelles dans Supabase: id, user_id, title, progression, due_date
export async function getProjects(userId: string): Promise<Project[]> {
  // Vérification initiale : si pas de userId, retour immédiat
  if (!userId || typeof userId !== "string") {
    return []
  }

  // Vérification du client Supabase
  if (!supabase) {
    return []
  }

  try {
    // Requête simplifiée comme demandé
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    // Gestion de l'erreur (même si c'est un objet vide {})
    if (error) {
      // Vérifier si l'erreur est un objet vide {}
      const errorKeys = Object.keys(error || {})
      const hasErrorContent = error && (
        (error as any).message || 
        (error as any).code || 
        (error as any).details ||
        errorKeys.length > 0
      )
      
      // Si objet vide {} ou pas de contenu utile, retour silencieux
      if (!hasErrorContent || errorKeys.length === 0) {
        // Objet vide {} - table probablement vide ou en attente
        return []
      }
      
      // Erreur réelle mais on retourne [] silencieusement
      return []
    }

    // Si data est null, undefined, ou pas un tableau, retourner []
    if (!data || !Array.isArray(data)) {
      return []
    }

    // Si tableau vide, retourner []
    if (data.length === 0) {
      return []
    }

    // Mapping sécurisé des données avec statistiques de tâches
    const mappedProjects: Project[] = []
    
    for (const project of data) {
      try {
        if (project && project.id) {
          // Statistiques de tâches via missions (tasks n'a pas project_id)
          const { data: missionIds } = await supabase
            .from("missions")
            .select("id")
            .eq("project_id", project.id)
          const ids = (missionIds ?? []).map((m: any) => m.id).filter(Boolean)
          let totalTasks = 0
          let completedTasks = 0
          if (ids.length > 0) {
            const { data: tasksData } = await supabase
              .from("tasks")
              .select("status")
              .in("mission_id", ids)
            totalTasks = tasksData?.length ?? 0
            completedTasks = tasksData?.filter((t: any) => t.status === "done").length ?? 0
          }
          
          mappedProjects.push({
            id: project.id || "",
            name: project.title || project.name || "",
            progress: project.progression || project.progress || 0,
            dueDate: project.due_date || "",
            client: (project as any).client || undefined,
            description: (project as any).description || undefined,
            totalTasks,
            completedTasks,
            assignedAgents: [], // Simplifié pour éviter les erreurs de relations
          })
        }
      } catch (mapError) {
        // Si erreur lors du mapping d'un projet, le skip silencieusement
        continue
      }
    }
    
    return mappedProjects
  } catch (e: any) {
    // Catch global - aucune erreur ne remonte
    return []
  }
}

// Messages - Table: public.messages
export interface Message {
  id: string
  user_id: string
  agent_id: string
  role: "user" | "agent"
  content: string
  created_at: string
}

export async function getMessages(agentId: string, userId: string): Promise<Message[]> {
  try {
    if (!agentId || !userId) {
      return []
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("agent_id", agentId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Erreur Supabase détaillée (getMessages):", JSON.stringify(error, null, 2))
      return []
    }

    if (!data || !Array.isArray(data)) {
      return []
    }

    return data
  } catch (error: any) {
    console.error("Erreur Supabase détaillée (getMessages catch):", JSON.stringify(error, null, 2))
    return []
  }
}

export async function saveMessage(
  userId: string,
  agentId: string,
  role: "user" | "agent",
  content: string
): Promise<Message | null> {
  try {
    if (!userId || !agentId || !content) {
      throw new Error("Missing required fields: userId, agentId, content")
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        agent_id: agentId,
        role: role,
        content: content,
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur Supabase détaillée (saveMessage):", JSON.stringify(error, null, 2))
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Erreur Supabase détaillée (saveMessage catch):", JSON.stringify(error, null, 2))
    throw error
  }
}

// Type helper pour le retour
interface Project {
  id: string
  name: string
  progress: number
  dueDate: string
  client?: string
  description?: string
  totalTasks?: number
  completedTasks?: number
  assignedAgents: Array<{
    id: string
    name: string
    avatar: string
    color: string
  }>
}

export async function addProject(userId: string, project: { name: string; dueDate: string; assignedAgentIds: string[]; client?: string; description?: string }) {
  try {
    const projectDataToInsert: any = {
      user_id: userId,
      title: project.name, // Utilise 'title' pour la DB
      progression: 0, // Utilise 'progression' pour la DB
      due_date: project.dueDate,
    }
    
    // Ajouter client et description si la colonne existe (ne plantera pas si elle n'existe pas)
    if (project.client) {
      projectDataToInsert.client = project.client
    }
    if (project.description) {
      projectDataToInsert.description = project.description
    }
    
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .insert(projectDataToInsert)
      .select()
      .single()

    if (projectError) {
      console.log("Détail erreur Supabase (addProject):", projectError)
      console.error("Error adding project to public.projects:", projectError)
      throw projectError
    }

    if (!projectData) {
      console.error("No data returned from project insert")
      throw new Error("No data returned from project insert")
    }

    // Add project agents
    if (project.assignedAgentIds.length > 0) {
      const { error: agentsError } = await supabase.from("project_agents").insert(
        project.assignedAgentIds.map((agentId) => ({
          project_id: projectData.id,
          agent_id: agentId,
        }))
      )

      if (agentsError) {
        console.log("Détail erreur Supabase (project_agents):", agentsError)
        console.error("Error adding project agents:", agentsError)
        throw agentsError
      }
    }

    return projectData
  } catch (error: any) {
    console.log("Détail erreur Supabase (catch addProject):", error)
    console.error("Failed to add project:", error)
    throw error
  }
}

// Tasks - Table: public.tasks (colonnes: id, mission_id, agent_id, title, output_url, status)
// Les tâches sont liées au projet via missions.project_id.
const TASK_STATUS_TO_COLUMN: Record<string, "todo" | "inprogress" | "done"> = {
  pending: "todo",
  working: "inprogress",
  done: "done",
}

export async function getTasks(projectId: string): Promise<{
  todo: any[]
  inprogress: any[]
  done: any[]
}> {
  const empty = { todo: [], inprogress: [], done: [] }
  try {
    const { data: missionsData, error: missionsError } = await supabase
      .from("missions")
      .select("id")
      .eq("project_id", projectId)

    if (missionsError) {
      console.error("Task Error (missions):", JSON.stringify(missionsError, null, 2))
      return empty
    }
    const missionIds = (missionsData ?? []).map((m: any) => m.id).filter(Boolean)
    if (missionIds.length === 0) return empty

    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, status, mission_id, description, image_url, agent_id, output_content, output_type")
      .in("mission_id", missionIds)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Task Error:", JSON.stringify(error, null, 2))
      return empty
    }

    if (!data || !Array.isArray(data) || data.length === 0) return empty

    const tasksByStatus: { todo: any[]; inprogress: any[]; done: any[] } = {
      todo: [],
      inprogress: [],
      done: [],
    }

    data.forEach((task: any) => {
      const column: "todo" | "inprogress" | "done" = TASK_STATUS_TO_COLUMN[task.status] ?? "todo"
      const taskData = {
        id: task.id,
        title: task.title ?? "",
        description: task.description ?? "",
        image_url: task.image_url ?? undefined,
        output_content: task.output_content ?? null,
        output_type: task.output_type ?? null,
        dueDate: "",
        tag: "Task",
        tagColor: "cyan",
        agent_id: task.agent_id ?? null,
        assignedAgents: [] as any[],
      }
      tasksByStatus[column].push(taskData)
    })

    return tasksByStatus
  } catch (err) {
    console.error("Task Error:", JSON.stringify(err, null, 2))
    return empty
  }
}

const INITIAL_STATUS_TO_DB: Record<string, string> = {
  todo: "pending",
  inprogress: "working",
  done: "done",
}

export async function addTask(
  projectId: string,
  task: {
    title: string
    description?: string
    dueDate?: string
    tag?: string
    tagColor?: string
    assignedAgentIds?: string[]
    initialStatus?: "todo" | "inprogress" | "done"
    missionId?: string | null
    agentId?: string | null
  }
) {
  if (!projectId?.trim()) {
    const err = new Error("addTask: projectId is required (manquant)")
    console.error("❌ addTask validation:", err.message)
    throw err
  }

  let missionId: string | null = task.missionId ?? null

  if (!missionId) {
    const { data: missionsData, error: missionsErr } = await supabase
      .from("missions")
      .select("id")
      .eq("project_id", projectId.trim())
      .limit(1)
    if (missionsErr) {
      console.error("❌ SUPABASE ERROR (missions fetch):", JSON.stringify(missionsErr, null, 2))
      throw missionsErr
    }
    missionId = missionsData?.[0]?.id ?? null
  }

  if (!missionId) {
    const err = new Error(
      "Aucune mission sur ce projet. Créez une mission avant d'ajouter des tâches."
    )
    console.error("❌ addTask: no mission for project", projectId)
    throw err
  }

  const status = task.initialStatus ?? "todo"
  const dbStatus = INITIAL_STATUS_TO_DB[status] ?? "pending"
  const agentId = (task.agentId ?? "ZEN").toString().trim() || "ZEN"

  const payload = {
    mission_id: missionId,
    agent_id: agentId,
    title: String(task.title ?? "").trim() || "Sans titre",
    description: String(task.description ?? "").trim() || null,
    output_url: null,
    status: dbStatus,
  }

  try {
    const { data: taskData, error: taskError } = await supabase
      .from("tasks")
      .insert(payload)
      .select()
      .single()

    if (taskError) {
      console.error("❌ SUPABASE ERROR (tasks insert):", JSON.stringify(taskError, null, 2))
      throw taskError
    }

    if (!taskData) {
      throw new Error("No data returned from task insert")
    }

    return taskData
  } catch (error) {
    console.error("❌ Failed to add task:", error instanceof Error ? error.message : String(error))
    throw error
  }
}

const UI_STATUS_TO_DB: Record<string, string> = {
  todo: "pending",
  inprogress: "working",
  done: "done",
}

export async function updateTaskStatus(taskId: string, status: "todo" | "inprogress" | "done") {
  try {
    const dbStatus = UI_STATUS_TO_DB[status] ?? "pending"
    const { error } = await supabase
      .from("tasks")
      .update({ status: dbStatus })
      .eq("id", taskId)

    if (error) {
      console.error("Task Error (update status):", JSON.stringify(error, null, 2))
      throw error
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("mission_id")
      .eq("id", taskId)
      .single()

    if (task?.mission_id) {
      const { data: mission } = await supabase
        .from("missions")
        .select("project_id")
        .eq("id", task.mission_id)
        .single()
      if (mission?.project_id) {
        await updateProjectProgression(mission.project_id)
      }
    }
  } catch (error) {
    console.error("Task Error (updateTaskStatus):", JSON.stringify(error, null, 2))
    throw error
  }
}

export async function updateProjectProgression(projectId: string) {
  try {
    const { data: missionIds } = await supabase
      .from("missions")
      .select("id")
      .eq("project_id", projectId)
    const ids = (missionIds ?? []).map((m: any) => m.id).filter(Boolean)
    if (ids.length === 0) {
      await supabase.from("projects").update({ progress: 0 }).eq("id", projectId)
      return
    }

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("status")
      .in("mission_id", ids)

    if (tasksError) {
      console.error("Task Error (progression):", JSON.stringify(tasksError, null, 2))
      return
    }

    if (!tasks || tasks.length === 0) {
      await supabase.from("projects").update({ progress: 0 }).eq("id", projectId)
      return
    }

    const doneCount = tasks.filter((t: any) => t.status === "done").length
    const progress = Math.round((doneCount / tasks.length) * 100)

    const { error } = await supabase
      .from("projects")
      .update({ progress })
      .eq("id", projectId)

    if (error) {
      console.error("Task Error (update progress):", JSON.stringify(error, null, 2))
    }
  } catch (error) {
    console.error("Task Error (updateProjectProgression):", JSON.stringify(error, null, 2))
  }
}

// Agent Tasks - Table: public.agent_tasks (Missions des agents)
// NOTE: getAgentTasks a été remplacé par useAgentStore().fetchTasks()

export async function addAgentTask(
  userId: string,
  task: {
    title: string
    agentId: string
    status?: "pending" | "in-progress" | "done"
  }
) {
  try {
    const { data, error } = await supabase
      .from("agent_tasks")
      .insert({
        user_id: userId,
        agent_id: task.agentId,
        title: task.title,
        status: task.status || "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding agent task:", error)
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      status: data.status as "pending" | "in-progress" | "done",
      agentId: data.agent_id,
      result: data.result || undefined,
      createdAt: new Date(data.created_at),
    }
  } catch (error) {
    console.error("Failed to add agent task:", error)
    throw error
  }
}

export async function updateAgentTaskStatus(
  taskId: string,
  status: "pending" | "in-progress" | "done",
  result?: string
) {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (result) {
      updateData.result = result
    }

    const { data, error } = await supabase
      .from("agent_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select()
      .single()

    if (error) {
      console.error("Error updating agent task status:", error)
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      status: data.status as "pending" | "in-progress" | "done",
      agentId: data.agent_id,
      result: data.result || undefined,
      createdAt: new Date(data.created_at),
    }
  } catch (error) {
    console.error("Failed to update agent task status:", error)
    throw error
  }
}
