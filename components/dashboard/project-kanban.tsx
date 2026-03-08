"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Calendar, Users, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTasks, addTask, updateTaskStatus } from "@/lib/supabase/database"
import { toast } from "sonner"
import { AgentAvatar2D2D } from "@/components/AgentAvatar2D2D"

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  tag: string
  tagColor: string
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

const colorConfig: Record<string, string> = {
  cyan: "from-cyan-500 to-blue-600",
  amber: "from-amber-500 to-orange-600",
  emerald: "from-emerald-500 to-teal-600",
  pink: "from-pink-500 to-rose-600",
  violet: "from-violet-500 to-purple-600",
}

interface ProjectKanbanProps {
  project: Project
  onBack: () => void
  onOpenAgentCockpit?: (agentId: string, taskTitle: string) => void
}

export function ProjectKanban({ project, onBack, onOpenAgentCockpit }: ProjectKanbanProps) {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    todo: [],
    inprogress: [],
    done: [],
  })
  const [loading, setLoading] = useState(true)

  // Load tasks from Supabase
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const data = await getTasks(project.id)
        setTasks(data)
      } catch (error: any) {
        toast.error("Erreur lors du chargement des tâches", {
          description: error.message,
        })
        // Fallback to empty if error
        setTasks({ todo: [], inprogress: [], done: [] })
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [project.id])

  const columns = [
    { id: "todo", title: "À faire", color: "gray" },
    { id: "inprogress", title: "En cours", color: "amber" },
    { id: "done", title: "Terminé", color: "emerald" },
  ]

  const handleTaskClick = async (taskId: string, currentColumn: string) => {
    const task = tasks[currentColumn].find((t) => t.id === taskId)
    if (!task) return

    // If task has assigned agents, open the first agent's cockpit
    if (task.assignedAgents.length > 0 && onOpenAgentCockpit) {
      const agentId = task.assignedAgents[0].id
      onOpenAgentCockpit(agentId, task.title)
      return
    }

    // Otherwise, move task to next column (if not done)
    if (currentColumn === "done") return // Can't move from done

    const nextStatus = currentColumn === "todo" ? "inprogress" : "done"

    try {
      // Update in database
      await updateTaskStatus(taskId, nextStatus)

      // Update local state
      const newTasks = { ...tasks }
      newTasks[currentColumn] = newTasks[currentColumn].filter((t) => t.id !== taskId)
      newTasks[nextStatus] = [...newTasks[nextStatus], task]
      setTasks(newTasks)
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour", {
        description: error.message,
      })
    }
  }

  const handleAddTask = async () => {
    const title = prompt("Titre de la tâche :")
    if (!title) return

    const description = prompt("Description :") || ""
    const dueDate = prompt("Date d'échéance (ex: 15 Mars 2024) :") || "Non définie"
    const tag = prompt("Tag (Marketing, Dev, Design, etc.) :") || "Général"
    const tagColor = prompt("Couleur du tag (cyan, amber, emerald, violet, pink) :") || "cyan"

    try {
      const newTask = await addTask(project.id, {
        title,
        description,
        dueDate,
        tag,
        tagColor,
        assignedAgentIds: [],
      })

      // Add to local state
      const newTasks = { ...tasks }
      newTasks.todo = [
        ...newTasks.todo,
        {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          dueDate: newTask.due_date,
          tag: newTask.tag,
          tagColor: newTask.tag_color,
          assignedAgents: [],
        },
      ]
      setTasks(newTasks)
      toast.success("Tâche créée avec succès !")
    } catch (error: any) {
      toast.error("Erreur lors de la création", {
        description: error.message,
      })
    }
  }

  const handleDeleteTask = async (taskId: string, columnId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;

    // Mise à jour optimiste (suppression visuelle immédiate)
    setTasks((prev) => ({
      ...prev,
      [columnId]: (prev[columnId] || []).filter((t) => t.id !== taskId),
    }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur serveur");
      toast.success("Tâche supprimée");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la suppression");
    }
  };

  const tagColorConfig: Record<string, string> = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header with Project Details */}
      <div className="border-b border-cyan-900/20 bg-gray-950/50 px-6 py-4 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
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

          {/* Assigned Agents */}
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
        </div>
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
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    column.color === "gray" && "bg-gray-400",
                    column.color === "amber" && "bg-amber-400",
                    column.color === "emerald" && "bg-emerald-400"
                  )}
                />
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <span className="ml-auto text-xs text-muted-foreground bg-gray-900/50 px-2 py-0.5 rounded-full">
                  {tasks[column.id]?.length || 0}
                </span>
              </div>
            </div>

            {/* Add Task Button (only in Todo column) */}
            {column.id === "todo" && (
              <div className="px-4 py-2 border-b border-cyan-900/10 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTask}
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-gray-900/30"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Assigner une Tâche
                </Button>
              </div>
            )}

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 min-h-0">
              {loading && column.id === "todo" ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
                  <p className="mt-2 text-xs text-muted-foreground">Rédaction du rapport par le salarié...</p>
                </div>
              ) : tasks[column.id]?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">Aucune tâche</p>
                </div>
              ) : (
                tasks[column.id]?.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task.id, column.id)}
                  className={cn(
                    "group relative rounded-lg border-4 border-blue-500 bg-gray-900/30 p-4 hover:border-cyan-500/30 hover:bg-gray-900/40 transition-all animate-pulse",
                    (task.assignedAgents.length > 0 && onOpenAgentCockpit) || (column.id !== "done") ? "cursor-pointer" : ""
                  )}
                >
                  {column.id === "done" && (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                    >
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border-2 border-amber-400/80 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                        LIVRABLE VALIDÉ
                      </span>
                    </motion.div>
                  )}
                  {/* Tag */}
                  <div className="mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        tagColorConfig[task.tagColor] || tagColorConfig.cyan
                      )}
                    >
                      {task.tag}
                    </span>
                  </div>

                  {/* BOUTON IN-FLOW DEBUG - à côté du titre */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("SUPPR ?")) handleDeleteTask(task.id, column.id);
                      }}
                      className="bg-red-600 text-white px-2 py-1 text-xs rounded mr-2 z-50 relative"
                    >
                      SUPPRIMER
                    </button>
                    <h4 className="font-semibold text-foreground">{task.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{task.dueDate}</span>
                    </div>
                  </div>

                  {/* Assigned Agent Avatar */}
                  <div className="flex items-center gap-2">
                    {task.assignedAgents.length > 0 && (
                      <div className="flex -space-x-2">
                        {task.assignedAgents.map((agent, index) => (
                          <div
                            key={agent.id}
                            className="relative"
                            style={{ zIndex: task.assignedAgents.length - index }}
                          >
                            <AgentAvatar2D name={agent.name} size="sm" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
