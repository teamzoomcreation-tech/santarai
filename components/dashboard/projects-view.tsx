"use client"

import { useState } from "react"
import { Plus, Calendar, Users, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProjectKanban } from "./project-kanban"
import { AgentCockpit } from "./agent-cockpit"
import { useAgents } from "@/contexts/agents-context"
import { useProjects } from "@/contexts/projects-context"
import type { Agent } from "./my-agents-view"
import { AgentAvatar2D } from "@/components/AgentAvatar2D"

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

function ProjectsView() {
  const { agents } = useAgents()
  const { projects, loading: projectsLoading, addProject, deleteProject } = useProjects()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<{ agent: Agent; initialMessage: string } | null>(null)

  const handleOpenAgentCockpit = (agentId: string, taskTitle: string) => {
    const agent = agents.find((a) => a.id === agentId)
    if (agent) {
      setSelectedAgent({
        agent,
        initialMessage: `Peux-tu commencer à travailler sur la tâche : ${taskTitle} ?`,
      })
    }
  }

  // Show Agent Cockpit if agent is selected
  if (selectedAgent) {
    return (
      <AgentCockpit
        agent={selectedAgent.agent}
        onBack={() => setSelectedAgent(null)}
        initialMessage={selectedAgent.initialMessage}
      />
    )
  }

  // Show Kanban if project is selected
  if (selectedProject) {
    return (
      <ProjectKanban
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onOpenAgentCockpit={handleOpenAgentCockpit}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-cyan-900/20 bg-gray-950/50 px-6 py-4 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dossiers & Projets Actifs</h2>
            <p className="text-sm text-muted-foreground">Gérez vos projets et missions en cours</p>
          </div>
          <Button
            onClick={() => {
              const name = prompt("Nom du projet :")
              if (!name) return
              const dueDate = prompt("Date d'échéance (ex: 15 Mars 2024) :") || "Non définie"
              addProject({ name, dueDate, assignedAgentIds: [] })
            }}
            className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Dossier
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 min-h-0">
        {projectsLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />
              <p className="mt-4 text-muted-foreground">Chargement des projets...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Aucun projet pour le moment</p>
              <p className="text-sm text-muted-foreground/60">Créez votre premier projet</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="group relative rounded-xl border border-cyan-900/20 bg-gray-900/50 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] cursor-pointer"
            >
              {/* BOUTON DE SUPPRESSION FLOTTANT */}
              <div className="absolute top-3 right-3 z-20">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    if (confirm("Voulez-vous vraiment supprimer ce projet et toutes ses missions ?")) {
                      deleteProject(project.id)
                    }
                  }}
                  title="Supprimer le projet"
                  aria-label="Supprimer le projet"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {/* Project Name */}
              <h3 className="mb-4 text-lg font-semibold text-foreground pr-10">{project.name}</h3>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-semibold text-cyan-400">{project.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Échéance : {project.dueDate}</span>
              </div>

              {/* Assigned Agents */}
              <div className="flex items-center gap-2">
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
                <span className="ml-2 text-xs text-muted-foreground">
                  {project.assignedAgents.length} agent{project.assignedAgents.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsView
