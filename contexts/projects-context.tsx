"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { getProjects, addProject as addProjectToDB } from "@/lib/supabase/database"
import { toast } from "sonner"

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

interface ProjectsContextType {
  projects: Project[]
  loading: boolean
  addProject: (project: { name: string; dueDate: string; assignedAgentIds: string[] }) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  refreshProjects: () => Promise<void>
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  // Initialisation forcée avec tableau vide
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const loadProjects = async () => {
    // Vérification immédiate : si pas de user ou session pas prête, return silencieux
    if (!user || !user.id) {
      setProjects([])
      setLoading(false)
      return
    }

    // Vérification que la session est prête
    if (!session) {
      setProjects([])
      setLoading(false)
      return
    }

    // Try/Catch global - aucune erreur ne remonte
    try {
      setLoading(true)
      
      const data = await getProjects(user.id)
      
      // S'assurer que data est toujours un tableau valide
      if (Array.isArray(data) && data.length >= 0) {
        setProjects(data)
      } else {
        setProjects([])
      }
    } catch (e) {
      // Catch silencieux - aucune erreur ne remonte à la console
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Attendre que la session soit prête avant de charger
    if (user && session) {
      loadProjects()
    } else {
      setProjects([])
      setLoading(false)
    }
  }, [user, session])

  const addProject = async (project: { name: string; dueDate: string; assignedAgentIds: string[] }) => {
    if (!user) {
      toast.error("Vous devez être connecté")
      return
    }

    try {
      await addProjectToDB(user.id, project)
      await loadProjects()
      toast.success("Projet créé avec succès !")
    } catch (error: any) {
      toast.error("Erreur lors de la création du projet", {
        description: error.message,
      })
      throw error
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!user) {
      toast.error("Vous devez être connecté")
      return
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erreur lors de la suppression")
      }
      await loadProjects()
      toast.success("Projet supprimé")
    } catch (error: any) {
      toast.error("Erreur lors de la suppression du projet", {
        description: error.message,
      })
      throw error
    }
  }

  return (
    <ProjectsContext.Provider value={{ projects, loading, addProject, deleteProject, refreshProjects: loadProjects }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectsContext)
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectsProvider")
  }
  return context
}
