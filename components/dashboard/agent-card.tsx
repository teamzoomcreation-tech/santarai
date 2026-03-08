"use client"

import { MoreVertical, Play, Pause, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AgentAvatar2D } from "@/components/AgentAvatar2D"
import { getAgentTheme } from "@/lib/agentTheme"

interface AgentCardProps {
  agent: {
    id: string
    name: string
    role: string
    status: "active" | "thinking" | "idle"
    avatar: {
      color: string
    }
    tasksCompleted: number
    efficiency: number
  }
}

const statusConfig = {
  active: {
    label: "Actif",
    class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  },
  thinking: {
    label: "Réflexion...",
    class: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
  },
  idle: {
    label: "En attente",
    class: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    dot: "bg-gray-400",
  },
}

export function AgentCard({ agent }: AgentCardProps) {
  const status = statusConfig[agent.status]
  const theme = getAgentTheme(agent.id || agent)

  return (
    <div 
      className="group relative rounded-xl border bg-gray-900/50 p-4 backdrop-blur-sm transition-all"
      style={{
        borderColor: `${theme.hex}30`,
        boxShadow: `0 0 0 0 ${theme.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${theme.hex}80`
        e.currentTarget.style.boxShadow = `0 0 20px ${theme.glow}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${theme.hex}30`
        e.currentTarget.style.boxShadow = `0 0 0 0 ${theme.glow}`
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AgentAvatar2D 
            name={agent.name} 
            size="lg"
          />
          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-900 border-cyan-900/30">
            <DropdownMenuItem className="text-foreground hover:bg-gray-800">
              <Play className="mr-2 h-4 w-4" />
              Démarrer
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground hover:bg-gray-800">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badge */}
      <div className={cn("mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs", status.class)}>
        <div className={cn("h-2 w-2 rounded-full", status.dot)} />
        {status.label}
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Tâches complétées</span>
          <span className="font-semibold text-foreground">{agent.tasksCompleted}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Efficacité</span>
          <span className="font-semibold" style={{ color: theme.hex }}>{agent.efficiency}%</span>
        </div>
      </div>
    </div>
  )
}
