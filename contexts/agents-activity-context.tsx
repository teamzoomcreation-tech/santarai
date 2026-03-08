"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Types
export interface Agent {
  id: string
  name: string
  role: string
  status: "idle" | "working" | "thinking" | "error"
  currentTask: string
  progress: number
  avatar: {
    color: string
  }
  tasksCompleted: number
  efficiency: number
}

export interface ActivityLog {
  id: string
  agentName: string
  message: string
  timestamp: Date
  type: "start" | "progress" | "complete" | "error"
}

interface AgentsActivityContextType {
  agents: Agent[]
  activityLogs: ActivityLog[]
  globalStats: {
    totalTasksCompleted: number
    totalTokensUsed: number
    activeAgents: number
  }
}

const AgentsActivityContext = createContext<AgentsActivityContextType | undefined>(undefined)

// Tâches possibles pour chaque type d'agent
const TASKS = {
  Copywriter: [
    "Rédaction article SEO",
    "Création posts LinkedIn",
    "Optimisation meta descriptions",
    "Génération titres accrocheurs",
    "Rédaction newsletters",
  ],
  "Dev Java": [
    "Refactoring microservices",
    "Optimisation requêtes SQL",
    "Correction bugs critiques",
    "Mise à jour dépendances",
    "Implémentation API REST",
  ],
  Analyst: [
    "Analyse données trafic",
    "Génération rapports KPI",
    "Étude comportement utilisateurs",
    "Prédictions tendances",
    "Audit performances",
  ],
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Copywriter",
    role: "Rédacteur IA",
    status: "idle",
    currentTask: "En attente...",
    progress: 0,
    avatar: { color: "cyan" },
    tasksCompleted: 0,
    efficiency: 95,
  },
  {
    id: "2",
    name: "Dev Java",
    role: "Développeur Backend",
    status: "idle",
    currentTask: "En attente...",
    progress: 0,
    avatar: { color: "emerald" },
    tasksCompleted: 0,
    efficiency: 92,
  },
  {
    id: "3",
    name: "Analyst",
    role: "Analyste Data",
    status: "idle",
    currentTask: "En attente...",
    progress: 0,
    avatar: { color: "violet" },
    tasksCompleted: 0,
    efficiency: 88,
  },
]

export function AgentsActivityProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [globalStats, setGlobalStats] = useState({
    totalTasksCompleted: 0,
    totalTokensUsed: 0,
    activeAgents: 0,
  })

  // Fonction pour ajouter un log d'activité
  const addLog = (agentName: string, message: string, type: ActivityLog["type"]) => {
    const newLog: ActivityLog = {
      id: `${Date.now()}-${Math.random()}`,
      agentName,
      message,
      timestamp: new Date(),
      type,
    }
    
    setActivityLogs((prev) => [newLog, ...prev].slice(0, 50)) // Garder les 50 derniers logs
  }

  // Fonction pour démarrer une nouvelle tâche
  const startNewTask = (agent: Agent) => {
    const tasks = TASKS[agent.name as keyof typeof TASKS] || ["Tâche générique"]
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)]
    
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agent.id
          ? {
              ...a,
              status: "working",
              currentTask: randomTask,
              progress: 0,
            }
          : a
      )
    )
    
    addLog(agent.name, `Démarrage: ${randomTask}`, "start")
  }

  // Fonction pour faire progresser une tâche
  const progressTask = (agent: Agent) => {
    const increment = Math.floor(Math.random() * 15) + 10 // Progression de 10-25% par tick
    const newProgress = Math.min(agent.progress + increment, 100)
    
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agent.id
          ? {
              ...a,
              progress: newProgress,
              status: newProgress === 100 ? "thinking" : "working",
            }
          : a
      )
    )
    
    if (newProgress === 100) {
      completeTask(agent)
    } else if (newProgress >= 50 && agent.progress < 50) {
      addLog(agent.name, `Progression 50% - ${agent.currentTask}`, "progress")
    }
  }

  // Fonction pour terminer une tâche
  const completeTask = (agent: Agent) => {
    const tokensUsed = Math.floor(Math.random() * 5000) + 2000 // 2000-7000 tokens
    
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agent.id
          ? {
              ...a,
              tasksCompleted: a.tasksCompleted + 1,
              efficiency: Math.min(a.efficiency + 1, 100),
            }
          : a
      )
    )
    
    setGlobalStats((prev) => ({
      totalTasksCompleted: prev.totalTasksCompleted + 1,
      totalTokensUsed: prev.totalTokensUsed + tokensUsed,
      activeAgents: agents.filter((a) => a.status === "working").length,
    }))
    
    addLog(agent.name, `✓ Terminé: ${agent.currentTask} (${tokensUsed.toLocaleString()} tokens)`, "complete")
    
    // Attendre 2 secondes avant de démarrer une nouvelle tâche
    setTimeout(() => {
      startNewTask(agent)
    }, 2000)
  }

  // Simulation d'activité autonome
  useEffect(() => {
    // Démarrer les agents après 1 seconde
    const startTimeout = setTimeout(() => {
      agents.forEach((agent) => {
        startNewTask(agent)
      })
    }, 1000)

    // Faire progresser les tâches toutes les 3 secondes
    const progressInterval = setInterval(() => {
      setAgents((currentAgents) => {
        currentAgents.forEach((agent) => {
          if (agent.status === "working" && agent.progress < 100) {
            progressTask(agent)
          } else if (agent.status === "thinking") {
            // Passer en idle après avoir "réfléchi"
            setTimeout(() => {
              startNewTask(agent)
            }, 1500)
          } else if (agent.status === "idle" && agent.progress === 0) {
            // Démarrer automatiquement si en idle
            setTimeout(() => {
              startNewTask(agent)
            }, Math.random() * 3000 + 2000) // Entre 2 et 5 secondes
          }
        })
        return currentAgents
      })
    }, 3000)

    // Mettre à jour les stats globales toutes les secondes
    const statsInterval = setInterval(() => {
      setGlobalStats((prev) => ({
        ...prev,
        activeAgents: agents.filter((a) => a.status === "working").length,
      }))
    }, 1000)

    return () => {
      clearTimeout(startTimeout)
      clearInterval(progressInterval)
      clearInterval(statsInterval)
    }
  }, [])

  return (
    <AgentsActivityContext.Provider value={{ agents, activityLogs, globalStats }}>
      {children}
    </AgentsActivityContext.Provider>
  )
}

export function useAgentsActivity() {
  const context = useContext(AgentsActivityContext)
  if (context === undefined) {
    throw new Error("useAgentsActivity must be used within an AgentsActivityProvider")
  }
  return context
}
