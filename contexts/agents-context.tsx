"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import type { Agent } from "@/components/dashboard/my-agents-view"
import { useAuth } from "./auth-context"
import { getAgents, addAgent as addAgentToDB, removeAgent as removeAgentFromDB } from "@/lib/supabase/database"
import { toast } from "sonner"

interface AgentsContextType {
  agents: Agent[]
  loading: boolean
  addAgent: (agent: Omit<Agent, "id">, onSuccess?: () => void) => Promise<void>
  removeAgent: (agentId: string) => Promise<void>
  refreshAgents: () => Promise<void>
}

const AgentsContext = createContext<AgentsContextType | undefined>(undefined)

function agentsEqual(a: Agent[], b: Agent[]): boolean {
  if (a.length !== b.length) return false
  const idsA = a.map((x) => x.id).sort().join(",")
  const idsB = b.map((x) => x.id).sort().join(",")
  return idsA === idsB
}

export function AgentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const loadAgents = useCallback(async () => {
    if (!user) {
      setAgents([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getAgents(user.id)
      setAgents((prev) => {
        if (agentsEqual(prev, data)) return prev
        return data
      })
    } catch (error: any) {
      toast.error("Erreur lors du chargement des agents", {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const addAgent = async (agent: Omit<Agent, "id">, onSuccess?: () => void) => {
    if (!user) {
      toast.error("Vous devez être connecté")
      return
    }

    try {
      const newAgent = await addAgentToDB(user.id, agent)
      setAgents((prev) => [...prev, newAgent])
      toast.success("Agent recruté avec succès !")
      
      // Appeler le callback de succès pour rediriger vers "Mes Agents"
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      // Gestion d'erreur améliorée avec JSON.stringify
      console.error("Erreur Supabase détaillée:", JSON.stringify(error, null, 2))
      toast.error("Erreur lors du recrutement", {
        description: error?.message || "Une erreur est survenue lors du recrutement",
      })
      throw error
    }
  }

  const removeAgent = async (agentId: string) => {
    try {
      await removeAgentFromDB(agentId, user?.id)
      setAgents((prev) => prev.filter((agent) => agent.id !== agentId))
      toast.success("Agent supprimé")
    } catch (error: any) {
      toast.error("Erreur lors de la suppression", {
        description: error.message,
      })
      throw error
    }
  }

  return (
    <AgentsContext.Provider value={{ agents, loading, addAgent, removeAgent, refreshAgents: loadAgents }}>
      {children}
    </AgentsContext.Provider>
  )
}

export function useAgents() {
  const context = useContext(AgentsContext)
  if (context === undefined) {
    throw new Error("useAgents must be used within an AgentsProvider")
  }
  return context
}
