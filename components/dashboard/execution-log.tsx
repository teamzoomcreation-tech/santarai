"use client"

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const logEntries = [
  { time: "14:32", message: "Salarié Marketing a complété la tâche #12", type: "success" },
  { time: "14:28", message: "Salarié Sales en cours de réflexion...", type: "info" },
  { time: "14:25", message: "Nouvelle tâche assignée à Salarié Support", type: "info" },
  { time: "14:20", message: "Salarié Marketing a démarré une nouvelle mission", type: "success" },
  { time: "14:15", message: "Système de sauvegarde automatique activé", type: "info" },
]

export function ExecutionLog() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-cyan-900/20 bg-gray-950/50 px-4 py-3 shrink-0">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Journal d&apos;exécution</h4>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 min-h-0">
        <div className="space-y-3">
          {logEntries.map((entry, index) => (
            <div
              key={index}
              className={cn(
                "rounded-lg border p-3 text-xs",
                entry.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-cyan-900/30 bg-gray-900/30"
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">{entry.time}</span>
              </div>
              <p className="text-foreground">{entry.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
