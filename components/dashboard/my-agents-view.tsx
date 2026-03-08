"use client"

import { useState } from "react"
import { Plus, Search, Settings, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AgentCard } from "./agent-card"
import { RecruitAgentDialog } from "./recruit-agent-dialog"
import { AgentCockpit } from "./agent-cockpit"
import { useAgents } from "@/contexts/agents-context"
import { Notifications } from "./notifications"
import { AgentAvatar2D } from "@/components/AgentAvatar2D"
import { toast } from "sonner"

export interface Agent {
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

interface MyAgentsViewProps {
  onOpenRecruitDialog: () => void
}

export function MyAgentsView({ onOpenRecruitDialog }: MyAgentsViewProps) {
  const { agents, loading, removeAgent } = useAgents()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  // Filter agents based on status and search
  const filteredAgents = (agents || []).filter((agent) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && agent.status === "active") ||
      (statusFilter === "idle" && (agent.status === "idle" || agent.status === "thinking"))

    const matchesSearch =
      searchQuery === "" ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  // Show Cockpit if agent is selected
  if (selectedAgent) {
    return <AgentCockpit agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-cyan-900/20 bg-gray-950/50 px-6 py-4 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Mes Salariés</h2>
            <p className="text-sm text-muted-foreground">Gérez votre équipe d'agents IA</p>
          </div>
          <div className="flex items-center gap-3">
            <Notifications />
            <Button
              onClick={onOpenRecruitDialog}
              className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un Salarié
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-cyan-900/20 bg-gray-950/30 px-6 py-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900/50 border-cyan-900/30 text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:ring-cyan-500/20 pl-10"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="border-b border-cyan-900/20 bg-gray-950/30 px-6 py-3 shrink-0">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="bg-gray-900/50 border border-cyan-900/30">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30"
            >
              Tous
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30"
            >
              Actifs
            </TabsTrigger>
            <TabsTrigger
              value="idle"
              className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30"
            >
              En attente
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Agents Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-0">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />
              <p className="mt-4 text-muted-foreground">Analyse du dossier en cours...</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Aucun agent trouvé</p>
              <p className="text-sm text-muted-foreground/60">
                {searchQuery ? "Essayez une autre recherche" : "Recrutez votre premier agent"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCardWithConfig 
                key={agent.id} 
                agent={agent} 
                onConfigure={() => setSelectedAgent(agent)}
                onDelete={async () => {
                  if (confirm(`Êtes-vous sûr de vouloir supprimer ${agent.name} ?`)) {
                    try {
                      await removeAgent(agent.id)
                      toast.success("Salarié supprimé avec succès")
                    } catch (error) {
                      toast.error("Erreur lors de la suppression")
                    }
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Agent Card with Configuration button
function AgentCardWithConfig({ agent, onConfigure, onDelete }: { agent: Agent; onConfigure: () => void; onDelete: () => void }) {
  const handleEdit = () => {
    console.log("Edit agent:", agent.id)
    toast.info("Fonctionnalité de modification à venir")
  }

  return (
    <div className="group relative rounded-xl border border-cyan-900/30 bg-gray-900/50 p-4 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
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
        {/* Menu d'actions */}
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
            <DropdownMenuItem 
              className="text-foreground hover:bg-gray-800"
              onClick={handleEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-400 hover:bg-red-500/10"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badge */}
      <div
        className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
          agent.status === "active"
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : agent.status === "thinking"
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
        }`}
      >
        <div
          className={`h-2 w-2 rounded-full ${
            agent.status === "active"
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              : agent.status === "thinking"
                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                : "bg-gray-400"
          }`}
        />
        {agent.status === "active"
          ? "Actif"
          : agent.status === "thinking"
            ? "Réflexion..."
            : "En attente"}
      </div>

      {/* Stats */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Tâches complétées</span>
          <span className="font-semibold text-foreground">{agent.tasksCompleted}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Efficacité</span>
          <span className="font-semibold text-cyan-400">{agent.efficiency}%</span>
        </div>
      </div>

      {/* Configuration Button */}
      <Button
        onClick={onConfigure}
        variant="outline"
        className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
      >
        <Settings className="mr-2 h-4 w-4" />
        Configuration
      </Button>
    </div>
  )
}
