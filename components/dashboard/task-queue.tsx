"use client"

import { useEffect } from "react"
import { useAgentStore } from "@/stores/useAgentStore"
import { CheckCircle2, Clock, PlayCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"

export function TaskQueue() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const { tasks, fetchTasks, updateTaskStatus, completeTask, deleteTask } = useAgentStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Afficher les 3 dernières tâches actives (non terminées)
  // Adapter les statuts : useAgentStore utilise 'todo' | 'progress' | 'done'
  const activeTasks = (tasks || [])
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 3)

  const getStatusConfig = (status: "todo" | "progress" | "done") => {
    switch (status) {
      case "todo":
        return {
          icon: Clock,
          color: "border-amber-500/50 bg-amber-500/10",
          iconColor: "text-amber-400",
          label: t.dashboard.taskQueue.statusPending,
        }
      case "progress":
        return {
          icon: PlayCircle,
          color: "border-blue-500/50 bg-blue-500/10",
          iconColor: "text-blue-400",
          label: t.dashboard.taskQueue.statusProgress,
        }
      case "done":
        return {
          icon: CheckCircle2,
          color: "border-emerald-500/50 bg-emerald-500/10",
          iconColor: "text-emerald-400",
          label: t.dashboard.taskQueue.statusDone,
        }
    }
  }

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t.dashboard.taskQueue.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTasks.length} {activeTasks.length > 1 ? t.dashboard.taskQueue.activeTasksPlural : t.dashboard.taskQueue.activeTasks}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
        {activeTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center">
              {t.dashboard.taskQueue.noTasks}
              <br />
              <span className="text-xs">{t.dashboard.taskQueue.launchFromChat}</span>
            </p>
          </div>
        ) : (
          activeTasks.map((task) => {
            const config = getStatusConfig(task.status)
            const Icon = config.icon

            return (
              <div
                key={task.id}
                className={cn(
                  "border-l-4 rounded-lg p-4 bg-gray-800/50 transition-all hover:bg-gray-800/70",
                  config.color
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn("h-4 w-4 shrink-0", config.iconColor)} />
                      <span className={cn("text-xs font-medium", config.iconColor)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(task.created_at)}
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteTask(task.id)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Actions rapides */}
                {task.status !== "done" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700/50">
                    {task.status === "todo" && (
                      <Button
                        onClick={() => updateTaskStatus(task.id, "progress")}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        {t.dashboard.taskQueue.start}
                      </Button>
                    )}
                    {task.status === "progress" && (
                      <Button
                        onClick={() => completeTask(task.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        {t.dashboard.taskQueue.complete}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
