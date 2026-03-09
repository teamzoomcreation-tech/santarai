"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import confetti from "canvas-confetti"
import { useAuth } from "@/contexts/auth-context"
import { useAgents } from "@/contexts/agents-context"
import { getProjects, getTasks, addTask } from "@/lib/supabase/database"
import { supabase } from "@/lib/supabase/client"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { ArrowLeft, Plus, Calendar, Users, Loader2, Bot, Trash2, UserPlus, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import { AgentAvatar2D } from "@/components/AgentAvatar2D"
import { TaskCard } from "@/components/dashboard/TaskCard"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"

interface Task {
  id: string
  title: string
  description: string
  image_url?: string
  output_content?: string | null
  output_type?: "text" | "code" | null
  dueDate: string
  tag: string
  tagColor: string
  agent_id?: string | null
  assignedAgents: Array<{
    id: string
    name: string
    avatar: string
    color: string
  }>
}

interface Project {
  id: string
  name: string
  progress: number
  dueDate: string
  assignedAgents: Array<{
    id: string
    name: string
    avatar: string
    color: string
  }>
}

interface Mission {
  id: string
  title: string
  status: string
  agent_id: string | null
  agent_name: string | null
  project_id: string | null
  created_at?: string
}

const colorConfig: Record<string, string> = {
  cyan: "from-cyan-500 to-blue-600",
  amber: "from-amber-500 to-orange-600",
  emerald: "from-emerald-500 to-teal-600",
  pink: "from-pink-500 to-rose-600",
  violet: "from-violet-500 to-purple-600",
}

const tagColorConfig: Record<string, string> = {
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
}

const AGENT_STYLE_ALIAS: Record<string, string> = {
  ghost: "MKT-G",
  pixel: "MKT-P",
  sumo: "MKT-S",
  radar: "MKT-R",
  zen: "ZEN",
}

function getAgentStyle(id: string | null): { color: string; glow: string; imgFilter: string; borderGlow: string } {
  const raw = (id ?? "ZEN").toString().trim()
  const key = AGENT_STYLE_ALIAS[raw.toLowerCase()] ?? raw.toUpperCase()
  switch (key) {
    case "MKT-G":
      return {
        color: "slate",
        glow: "shadow-slate-500/50",
        imgFilter: "drop-shadow(0 0 15px rgba(148,163,184,0.5))",
        borderGlow: "0 0 20px rgba(148,163,184,0.3)",
      }
    case "MKT-P":
      return {
        color: "purple",
        glow: "shadow-purple-500/50",
        imgFilter: "drop-shadow(0 0 15px rgba(168,85,247,0.5))",
        borderGlow: "0 0 20px rgba(168,85,247,0.3)",
      }
    case "MKT-S":
      return {
        color: "emerald",
        glow: "shadow-emerald-500/50",
        imgFilter: "drop-shadow(0 0 15px rgba(16,185,129,0.5))",
        borderGlow: "0 0 20px rgba(16,185,129,0.3)",
      }
    case "MKT-R":
      return {
        color: "blue",
        glow: "shadow-blue-500/50",
        imgFilter: "drop-shadow(0 0 15px rgba(59,130,246,0.5))",
        borderGlow: "0 0 20px rgba(59,130,246,0.3)",
      }
    case "ZEN":
    default:
      return {
        color: "cyan",
        glow: "shadow-cyan-500/50",
        imgFilter: "drop-shadow(0 0 15px rgba(34,211,238,0.5))",
        borderGlow: "0 0 20px rgba(34,211,238,0.3)",
      }
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  failed: "Échouée",
}

function MissionCard({ mission }: { mission: Mission }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 150 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)
  const [imgError, setImgError] = useState(false)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const normX = (e.clientX - centerX) / (rect.width / 2)
      const normY = (e.clientY - centerY) / (rect.height / 2)
      mouseX.set(-normX * 12)
      mouseY.set(-normY * 12)
    },
    [mouseX, mouseY]
  )
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  const style = getAgentStyle(mission.agent_id)
  const isInProgress = mission.status === "in_progress"
  const agentLabel = mission.agent_name || mission.agent_id || "ZEN"

  return (
    <Link href={`/dashboard/missions/${mission.id}`} className="block outline-none">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={false}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative overflow-visible rounded-xl border bg-slate-900/60 backdrop-blur-md p-5 min-h-[160px]",
          "border-slate-700 transition-colors hover:border-slate-600",
          isInProgress && "animate-mission-breathing border-2 shadow-lg"
        )}
        style={
          isInProgress
            ? { boxShadow: style.borderGlow, borderColor: "rgba(245, 158, 11, 0.5)" }
            : undefined
        }
      >
        <div className="relative z-10">
          <h4 className="font-semibold text-slate-100 mb-1 line-clamp-2 pr-24">{mission.title}</h4>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-slate-200",
                style.glow,
                "bg-slate-800/80 border-slate-600"
              )}
            >
              {agentLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                mission.status === "completed" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                mission.status === "in_progress" && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                mission.status === "pending" && "bg-slate-500/10 text-slate-400 border-slate-500/30",
                mission.status === "failed" && "bg-red-500/10 text-red-400 border-red-500/30",
                !["pending", "in_progress", "completed", "failed"].includes(mission.status) && "bg-slate-500/10 text-slate-400 border-slate-500/30"
              )}
            >
              {STATUS_LABELS[mission.status] ?? mission.status}
            </span>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-28 h-28 pointer-events-none overflow-visible">
          <motion.div
            className="absolute bottom-0 right-0 w-28 h-28 flex items-center justify-center"
            style={{ x, y }}
          >
            {imgError ? (
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center border-2 border-slate-600 bg-slate-800/80",
                  "text-slate-500"
                )}
                style={{ filter: style.imgFilter }}
              >
                <Bot className="w-10 h-10" />
              </div>
            ) : (
              <img
                src="/avatars/agent-base.png"
                alt=""
                className="w-20 h-20 object-contain select-none"
                style={{ filter: style.imgFilter }}
                onError={() => setImgError(true)}
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </Link>
  )
}

function ProjectDetailContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    todo: [],
    inprogress: [],
    done: [],
  })
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogColumn, setDialogColumn] = useState<"todo" | "inprogress" | "done">("todo")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskTag, setNewTaskTag] = useState("Marketing")
  const [newTaskTagColor, setNewTaskTagColor] = useState("cyan")
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const { agents: myAgents } = useAgents()
  const [agentsFromTable, setAgentsFromTable] = useState<Array<{ id: string; name: string; role?: string; avatar_color?: string }>>([])
  const [webhookUrl, setWebhookUrl] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("santarai_webhook_url") ?? "" : ""
  )
  const [isSendingWebhook, setIsSendingWebhook] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from("agents")
      .select("id, name, avatar_color, role")
      .eq("user_id", user.id)
      .then(({ data }) => setAgentsFromTable(data ?? []), () => setAgentsFromTable([]))
  }, [user?.id])

  const availableAgents = useMemo(() => {
    const fromContext = (myAgents ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      avatar_color: a.avatar?.color ?? "cyan",
    }))
    const ids = new Set(fromContext.map((a) => a.id))
    const fromTable = (agentsFromTable ?? []).filter((a) => !ids.has(a.id))
    return [...fromContext, ...fromTable]
  }, [myAgents, agentsFromTable])

  const loadProject = async () => {
    if (!user?.id || !projectId) return

    try {
      const projects = await getProjects(user.id)
      const foundProject = projects.find((p) => p.id === projectId)
      if (foundProject) {
        setProject(foundProject)
      } else {
        toast.error("Projet introuvable")
        router.push("/dashboard/projects")
      }
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error)
      toast.error("Erreur lors du chargement du projet")
      router.push("/dashboard/projects")
    }
  }

  const loadTasks = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      const data = await getTasks(projectId)
      setTasks(data)
      // Reload project to get updated progression
      if (user?.id) {
        await loadProject()
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des tâches", {
        description: error.message,
      })
      setTasks({ todo: [], inprogress: [], done: [] })
    } finally {
      setLoading(false)
    }
  }

  const loadMissions = async () => {
    if (!projectId) return
    try {
      const { data: rows } = await supabase
        .from("missions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
      const list: Mission[] = Array.isArray(rows)
        ? rows.map((r: any) => ({
            id: r.id,
            title: r.title ?? "",
            status: r.status ?? "pending",
            agent_id: r.agent_id ?? null,
            agent_name: r.agent_name ?? null,
            project_id: r.project_id ?? null,
            created_at: r.created_at,
          }))
        : []
      setMissions(list)
    } catch (e) {
      console.error("Erreur chargement missions:", e)
      setMissions([])
    }
  }

  useEffect(() => {
    if (user && projectId) {
      loadProject()
      loadTasks()
      loadMissions()
    }
  }, [user, projectId])

  const handleTaskStatusChange = async (taskId: string, currentStatus: string, newStatus: "todo" | "inprogress" | "done") => {
    if (newStatus === "inprogress") {
      const task = tasks[currentStatus]?.find((t) => t.id === taskId)
      if (task && !task.agent_id) {
        toast.error("Assignez un agent d'abord")
        return
      }
    }
    const clearOutput = currentStatus === "done" && (newStatus === "todo" || newStatus === "inprogress")
    try {
      const res = await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus, clearOutput }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? "Erreur lors de la mise à jour")
        return
      }
      await loadTasks()
      toast.success("Statut de la tâche mis à jour")

      if (data.mission) {
        setMissions((prev) =>
          prev.map((m) =>
            m.id === data.mission.id ? { ...m, status: data.mission.status } : m
          )
        )
      }
      if (data.nextMissionActivated) {
        setMissions((prev) =>
          prev.map((m) =>
            m.id === data.nextMissionActivated.id ? { ...m, status: data.nextMissionActivated.status } : m
          )
        )
      }

      if (newStatus === "done") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.5, y: 0.6 },
          colors: ["#10B981", "#34D399", "#FFD700"],
        })
      }
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour", {
        description: error.message,
      })
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Le titre de la tâche est requis")
      return
    }

    if (!projectId?.trim()) {
      toast.error("Projet introuvable (projectId manquant)")
      return
    }

    setIsCreating(true)
    try {
      let targetMissionId: string | null = missions.length > 0 ? missions[0].id : null

      if (!targetMissionId) {
        if (!user?.id) {
          throw new Error("Utilisateur non connecté")
        }
        const { data: newMission, error } = await supabase
          .from("missions")
          .insert({
            title: "Général",
            project_id: projectId,
            status: "in_progress",
            user_id: user.id,
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }
        if (newMission) {
          targetMissionId = newMission.id
          setMissions([
            {
              id: newMission.id,
              title: newMission.title ?? "Général",
              status: newMission.status ?? "in_progress",
              agent_id: newMission.agent_id ?? null,
              agent_name: newMission.agent_name ?? null,
              project_id: newMission.project_id ?? null,
              created_at: newMission.created_at,
            },
          ])
        }
      }

      await addTask(projectId, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || "",
        dueDate: newTaskDueDate.trim() || "Non définie",
        tag: newTaskTag,
        tagColor: newTaskTagColor,
        assignedAgentIds: [],
        initialStatus: dialogColumn,
        missionId: targetMissionId,
        agentId: "ZEN",
      })

      toast.success("Tâche créée avec succès !")
      setIsDialogOpen(false)
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskDueDate("")
      setNewTaskTag("Marketing")
      setNewTaskTagColor("cyan")
      setDialogColumn("todo")
      await loadTasks()
    } catch (error: any) {
      const msg =
        error?.message ??
        (typeof error === "object" ? JSON.stringify(error) : String(error))
      console.error("❌ Error adding task:", msg)
      toast.error("Erreur lors de la création", {
        description: msg,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenTaskDialog = (columnId: "todo" | "inprogress" | "done") => {
    setDialogColumn(columnId)
    setIsDialogOpen(true)
  }

  const handleAssignAgent = async (taskId: string, agentId: string) => {
    try {
      const value = agentId === "__none__" || !agentId ? null : agentId
      const { error } = await supabase
        .from("tasks")
        .update({ agent_id: value })
        .eq("id", taskId)
      if (error) throw error
      toast.success(value ? "Agent assigné" : "Agent désassigné")
      await loadTasks()
    } catch (e: any) {
      toast.error("Erreur lors de l'assignation", { description: e?.message })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    setTasks((prev) => {
      const newTasks = { ...prev };
      Object.keys(newTasks).forEach((colId) => {
        newTasks[colId] = newTasks[colId].filter((t) => t.id !== taskId);
      });
      return newTasks;
    });

    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      toast.success("Tâche supprimée avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique lors de la suppression");
      loadTasks();
    }
  };

  const columns = [
    { id: "todo", title: "À faire", color: "gray", emoji: "🔴" },
    { id: "inprogress", title: "En cours", color: "amber", emoji: "🟡" },
    { id: "done", title: "Terminé", color: "emerald", emoji: "🟢" },
  ]

  const getStatusFromColumnId = (columnId: string): "todo" | "inprogress" | "done" => {
    if (columnId === "done") return "done"
    if (columnId === "inprogress") return "inprogress"
    return "todo"
  }

  const handlePushProjectToExternal = async () => {
    const url = webhookUrl.trim()
    if (!url) {
      toast.error("Collez l'URL de destination (Webhook / Zapier / Make)")
      return
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("L'URL doit commencer par http:// ou https://")
      return
    }
    if (!project) return
    setIsSendingWebhook(true)
    try {
      const allTasks = columns.flatMap((col) => tasks[col.id] ?? []).map((t) => ({
        title: t.title,
        status: t.tag,
        output_content: t.output_content ?? null,
      }))
      const payload = {
        projectName: project.name,
        projectId: project.id,
        progress: project.progress,
        tasks: allTasks,
        timestamp: new Date().toISOString(),
      }
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: url, payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? res.statusText ?? "Erreur d'envoi")
      if (typeof window !== "undefined") localStorage.setItem("santarai_webhook_url", url)
      toast.success("Propulsion réussie")
    } catch (err) {
      toast.error("Erreur de propulsion", {
        description: err instanceof Error ? err.message : "Vérifiez l'URL et réessayez.",
      })
    } finally {
      setIsSendingWebhook(false)
    }
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header with Project Details */}
      <div className="border-b border-cyan-900/20 bg-gray-950/50 px-6 py-4 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/dashboard/projects")}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="h-6 w-px bg-cyan-900/20" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">{project.name}</h2>
              <p className="text-sm text-muted-foreground">Vue Kanban - Gestion des tâches</p>
            </div>
          </div>
        </div>

        {/* Project Progress and Agents */}
        <div className="flex items-center gap-6">
          {/* Progress Bar */}
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-semibold text-cyan-400">{project.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Assigned Agents - Optionnel */}
          {project.assignedAgents && project.assignedAgents.length > 0 && (
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {project.assignedAgents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className="relative"
                    style={{ zIndex: project.assignedAgents.length - index }}
                  >
                    <AgentAvatar2D name={agent.name} size="md" />
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {project.assignedAgents.length} agent{project.assignedAgents.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Lien de Synchronisation / Publication — Connecteur */}
        <div className="mt-4 pt-4 border-t border-cyan-900/20">
          <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">
            {t.dashboard.missions.syncLinkLabel}
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            {t.dashboard.missions.syncLinkHint}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="https://hooks.zapier.com/... ou URL de votre Webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1 bg-gray-900/50 border-cyan-900/30 font-mono text-sm text-foreground"
            />
            <Button
              type="button"
              onClick={handlePushProjectToExternal}
              disabled={isSendingWebhook}
              className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs gap-2"
            >
              {isSendingWebhook ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.dashboard.missions.pushSending}
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  {t.dashboard.missions.pushButton}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* SALLE DES OPÉRATIONS — War Room */}
      <div className="border-b border-slate-800 bg-slate-950/30 px-6 py-5 shrink-0">
        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight text-slate-100">SALLE DES OPÉRATIONS</h3>
          <p className="mt-1 font-mono text-xs text-slate-500">
            &gt; mission_grid.active — {missions.length} mission{missions.length !== 1 ? "s" : ""} chargée
            {missions.length !== 1 ? "s" : ""}
          </p>
        </div>
        {missions.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune mission planifiée.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 overflow-x-auto custom-scrollbar min-h-0">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-[33.333%] border-r border-cyan-900/10 bg-gray-950/20 flex flex-col"
          >
            {/* Column Header */}
            <div className="px-4 py-3 border-b border-cyan-900/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{column.emoji}</span>
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-gray-900/50 px-2 py-0.5 rounded-full">
                  {tasks[column.id]?.length || 0}
                </span>
              </div>
            </div>

            {/* Add Task Button (in all columns) */}
            <div className="px-4 py-2 border-b border-cyan-900/10 shrink-0">
              <Dialog 
                open={isDialogOpen && dialogColumn === column.id} 
                onOpenChange={(open) => {
                  if (!open) setIsDialogOpen(false)
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenTaskDialog(column.id as "todo" | "inprogress" | "done")}
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-gray-900/30"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    {t.dashboard.taskDetail.assignTask}
                  </Button>
                </DialogTrigger>
                  <DialogContent className="bg-gray-950 border-cyan-900/30 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        Créer une nouvelle tâche - {columns.find(c => c.id === dialogColumn)?.emoji} {columns.find(c => c.id === dialogColumn)?.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="task-title" className="text-foreground">
                          Titre
                        </Label>
                        <Input
                          id="task-title"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Ex: Rédiger le brief créatif"
                          className="bg-gray-900/50 border-cyan-900/30 text-foreground mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-description" className="text-foreground">
                          Description
                        </Label>
                        <Textarea
                          id="task-description"
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          placeholder="Description de la tâche..."
                          className="bg-gray-900/50 border-cyan-900/30 text-foreground mt-2"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-due-date" className="text-foreground">
                          Date d'échéance
                        </Label>
                        <Input
                          id="task-due-date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          placeholder="Ex: 15 Mars 2024"
                          className="bg-gray-900/50 border-cyan-900/30 text-foreground mt-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-tag" className="text-foreground">
                            Tag
                          </Label>
                          <Input
                            id="task-tag"
                            value={newTaskTag}
                            onChange={(e) => setNewTaskTag(e.target.value)}
                            placeholder="Marketing"
                            className="bg-gray-900/50 border-cyan-900/30 text-foreground mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="task-tag-color" className="text-foreground">
                            Couleur
                          </Label>
                          <Select value={newTaskTagColor} onValueChange={setNewTaskTagColor}>
                            <SelectTrigger id="task-tag-color" className="bg-gray-900/50 border-cyan-900/30 text-foreground mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-cyan-900/30">
                              <SelectItem value="cyan">Cyan</SelectItem>
                              <SelectItem value="amber">Amber</SelectItem>
                              <SelectItem value="emerald">Emerald</SelectItem>
                              <SelectItem value="violet">Violet</SelectItem>
                              <SelectItem value="pink">Pink</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="border-cyan-900/30 text-muted-foreground"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleCreateTask}
                          disabled={isCreating || !newTaskTitle.trim()}
                          className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Création...
                            </>
                          ) : (
                            "Créer"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0">
              {loading && column.id === "todo" ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-400" />
                  <p className="mt-2 text-xs text-muted-foreground">Chargement...</p>
                </div>
              ) : tasks[column.id]?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">Aucune tâche</p>
                </div>
              ) : (
                tasks[column.id]?.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    columnId={column.id as "todo" | "inprogress" | "done"}
                    availableAgents={availableAgents}
                    tagColorConfig={tagColorConfig}
                    onStatusChange={handleTaskStatusChange}
                    onDelete={handleDeleteTask}
                    onReload={loadTasks}
                    onTaskClick={setSelectedTask}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task detail modal - contenu / output de l'IA + image maquette */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="bg-gray-950 border-cyan-900/30 max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground pr-8">{t.dashboard.taskDetail.detailTitle} — {selectedTask?.title}</DialogTitle>
            <DialogDescription className="sr-only">
              {t.dashboard.taskDetail.detailDescriptionSr}
            </DialogDescription>
          </DialogHeader>
          {selectedTask?.image_url && (
            <div className="shrink-0 -mx-6 -mt-2 mb-4">
              <div className="relative rounded-xl overflow-hidden border border-cyan-900/30 shadow-xl shadow-cyan-500/10 aspect-video bg-gray-900">
                <img
                  src={selectedTask.image_url}
                  alt="Rendu visuel"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 rounded-md bg-cyan-500/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-950 shadow-lg">
                  Généré par IA
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Rendu visuel</p>
            </div>
          )}
          <div className="overflow-y-auto flex-1 min-h-0 py-2 -mx-1 px-1">
            {selectedTask?.output_content ? (
              <div>
                <p className="text-xs text-cyan-400 font-medium mb-2">Résultat généré</p>
                {selectedTask.output_type === "code" ? (
                  <pre className="bg-gray-900 rounded-lg p-4 text-sm text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono">
                    <code>{selectedTask.output_content}</code>
                  </pre>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-200 prose-headings:text-slate-100 prose-p:text-slate-300 prose-ul:text-slate-300 prose-li:marker:text-cyan-400">
                    <ReactMarkdown>{selectedTask.output_content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : selectedTask?.description ? (
              <div className="prose prose-invert prose-sm max-w-none text-slate-200 prose-headings:text-slate-100 prose-p:text-slate-300 prose-ul:text-slate-300 prose-li:marker:text-cyan-400">
                <ReactMarkdown>{selectedTask.description}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucun contenu pour l&apos;instant. L&apos;agent peut enregistrer son travail ici.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  )
}
