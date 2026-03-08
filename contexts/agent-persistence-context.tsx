"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AgentPersistenceState {
  [agentId: string]: {
    lastState: string
    lastPosition: [number, number, number]
    lastUpdate: number
  }
}

interface AgentPersistenceContextType {
  getAgentState: (agentId: string) => AgentPersistenceState[string] | null
  saveAgentState: (agentId: string, state: string, position: [number, number, number]) => void
  clearAgentState: (agentId: string) => void
}

const AgentPersistenceContext = createContext<AgentPersistenceContextType | undefined>(undefined)

export function AgentPersistenceProvider({ children }: { children: ReactNode }) {
  const [persistedStates, setPersistedStates] = useState<AgentPersistenceState>({})

  // Charger depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas360_agent_states")
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Record<string, AgentPersistenceState[string]>
          // Nettoyer les états de plus de 24h
          const now = Date.now()
          const cleaned: AgentPersistenceState = Object.fromEntries(
            Object.entries(parsed).filter(([_, state]) => {
              return state && now - state.lastUpdate < 24 * 60 * 60 * 1000
            })
          ) as AgentPersistenceState
          setPersistedStates(cleaned)
        } catch (e) {
          console.warn("Erreur lors du chargement des états persistés")
        }
      }
    }
  }, [])

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(persistedStates).length > 0) {
      localStorage.setItem("atlas360_agent_states", JSON.stringify(persistedStates))
    }
  }, [persistedStates])

  const getAgentState = (agentId: string) => {
    return persistedStates[agentId] || null
  }

  const saveAgentState = (agentId: string, state: string, position: [number, number, number]) => {
    setPersistedStates((prev) => ({
      ...prev,
      [agentId]: {
        lastState: state,
        lastPosition: position,
        lastUpdate: Date.now(),
      },
    }))
  }

  const clearAgentState = (agentId: string) => {
    setPersistedStates((prev) => {
      const newState = { ...prev }
      delete newState[agentId]
      return newState
    })
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas360_agent_states")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          delete parsed[agentId]
          localStorage.setItem("atlas360_agent_states", JSON.stringify(parsed))
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  return (
    <AgentPersistenceContext.Provider value={{ getAgentState, saveAgentState, clearAgentState }}>
      {children}
    </AgentPersistenceContext.Provider>
  )
}

export function useAgentPersistence() {
  const context = useContext(AgentPersistenceContext)
  if (!context) {
    throw new Error("useAgentPersistence must be used within AgentPersistenceProvider")
  }
  return context
}
