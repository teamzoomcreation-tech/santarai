"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Calendar, Users, Trash2, CheckCircle2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTasks, addTask, updateTaskStatus } from "@/lib/supabase/database"
import { toast } from "sonner"
import { AgentAvatar2D } from "@/components/AgentAvatar2D"

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

interface ProjectKanbanProps {
  project: Project
  onBack: () => void
  onOpenAgentCockpit?: (agentId: string, taskTitle: string) => void
}

const tagColorConfig: Record<string, string> = {
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
}

export function ProjectKanban({ project, onBack, onOpenAgentCockpit }: ProjectKanbanProps) {
  // Only two visible columns: todo and done (inprogress tasks shown in todo)
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    todo: [],
    inprogress: [],
    done: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const data = await getTasks(project.id)
        // Merge inprogress tasks into todo for display
        setTasks({
          todo: [...(data.todo ?? []), ...(data.inprogress ?? [])],
          inprogress: [],
          done: data.done ?? [],
        })
      } catch (error: any) {
        toast.error("Erreur lors du chargement des tâches", { description: error.message })
        setTasks({ todo: [], inprogress: [], done: [] })
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
  }, [project.id])

  const handleMarkDone = async (taskId: string) => {
    const task = tasks.todo.find((t) => t.id === taskId)
    if (!task) return

    try {
      await updateTaskStatus(taskId, "done")
      setTasks((prev) => ({
        ...prev,
        todo: prev.todo.filter((t) => t.id !== taskId),
        done: [task, ...prev.done],
      }))
      toast.success("Tâche marquée comme terminée")
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour", { description: error.message })
    }
  }

  const handleOpenCockpit = (task: Task) => {
    if (task.assignedAgents.length > 0 && onOpenAgentCockpit) {
      onOpenAgentCockpit(task.assignedAgents[0].id, task.title)
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
      setTasks((prev) => ({
        ...prev,
        todo: [
          ...prev.todo,
          {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description,
            dueDate: newTask.due_date,
            tag: newTask.tag,
            tagColor: newTask.tag_color,
            assignedAgents: [],
          },
        ],
      }))
      toast.success("Tâche créée avec succès !")
    } catch (error: any) {
      toast.error("Erreur lors de la création", { description: error.message })
    }
  }

  const handleDeleteTask = async (taskId: string, columnId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return
    setTasks((prev) => ({
      ...prev,
      [columnId]: (prev[columnId] || []).filter((t) => t.id !== taskId),
    }))
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erreur serveur")
      toast.success("Tâche supprimée")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const columns = [
    {
      id: "todo" as const,
      title: "À faire",
      dotColor: "bg-slate-400",
      headerColor: "text-slate-300",
    },
    {
      id: "done" as const,
      title: "Terminé",
      dotColor: "bg-emerald-400",
      headerColor: "text-emerald-300",
    },
  ]

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/5 bg-gray-950/50 px-4 py-3 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{project.name}</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">Gestion des tâches</p>
          </div>
        </div>

        {/* Progress + Agents */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-semibold text-cyan-400">{project.progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex -space-x-1.5">
              {project.assignedAgents.slice(0, 4).map((agent, index) => (
                <div
                  key={agent.id}
                  className="relative"
                  style={{ zIndex: project.assignedAgents.length - index }}
                >
                  <AgentAvatar2D name={agent.name} size="sm" />
                </div>
              ))}
            </div>
            {project.assignedAgents.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {project.assignedAgents.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board — vertical on mobile, horizontal on lg */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:h-full gap-0 lg:gap-0">
          {columns.map((column, colIndex) => (
            <div
              key={column.id}
              className={cn(
                "flex flex-col lg:flex-1",
                colIndex < columns.length - 1 && "border-b lg:border-b-0 lg:border-r border-white/5"
              )}
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-white/5 shrink-0 sticky top-0 bg-gray-950/90 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", column.dotColor)} />
                  <h3 className={cn("font-semibold text-sm", column.headerColor)}>{column.title}</h3>
                  <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full tabular-nums">
                    {tasks[column.id]?.length ?? 0}
                  </span>
                </div>
              </div>

              {/* Add Task (todo only) */}
              {column.id === "todo" && (
                <div className="px-3 py-2 border-b border-white/5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddTask}
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5 text-xs h-8"
                  >
                    <Plus className="mr-1.5 h-3 w-3" />
                    Ajouter une tâche
                  </Button>
                </div>
              )}

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 lg:min-h-0">
                {loading && column.id === "todo" ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400" />
                    <p className="text-xs text-muted-foreground">Chargement…</p>
                  </div>
                ) : tasks[column.id]?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    {column.id === "done" ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
                        <p className="text-xs text-muted-foreground">Aucun livrable encore</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucune tâche en attente</p>
                    )}
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {tasks[column.id]?.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="group relative rounded-xl border border-white/5 bg-gray-900/40 p-3.5 hover:border-white/10 hover:bg-gray-900/60 transition-colors"
                      >
                        {/* Done badge */}
                        {column.id === "done" && (
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              LIVRABLE VALIDÉ
                            </span>
                          </div>
                        )}

                        {/* Tag + Delete */}
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0",
                              tagColorConfig[task.tagColor] || tagColorConfig.cyan
                            )}
                          >
                            {task.tag}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTask(task.id, column.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                            aria-label="Supprimer la tâche"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-sm text-foreground leading-snug mb-1">
                          {task.title}
                        </h4>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span className="truncate">{task.dueDate}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Agent avatars */}
                            {task.assignedAgents.length > 0 && (
                              <div className="flex -space-x-1.5">
                                {task.assignedAgents.slice(0, 3).map((agent, index) => (
                                  <div
                                    key={agent.id}
                                    className="relative cursor-pointer"
                                    style={{ zIndex: task.assignedAgents.length - index }}
                                    onClick={() => handleOpenCockpit(task)}
                                  >
                                    <AgentAvatar2D name={agent.name} size="sm" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Mark done button (todo only) */}
                            {column.id === "todo" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkDone(task.id)
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                              >
                                <Zap className="h-2.5 w-2.5" />
                                Terminer
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
