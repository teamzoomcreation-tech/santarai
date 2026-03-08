"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAgents } from "@/contexts/agents-context"
import { useDashboardStore } from "@/lib/store"
import { Cpu } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { ActivityLogPanel } from "./activity-log"
import { TaskQueue } from "./task-queue"
import { StatsCards } from "./stats-cards"
import { NeuralInput } from "./NeuralInput"
import { BoardroomModal } from "./BoardroomModal"

function Loading3DScene() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  return (
    <div className="h-full w-full bg-slate-900 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-cyan-400 text-sm">{t.dashboard.common.loading}</div>
    </div>
  )
}

const LiveOfficeScene = dynamic(() => import("@/components/LiveOfficeScene"), {
  ssr: false,
  loading: () => <Loading3DScene />,
})

/**
 * Dashboard QG V2 - Layout Bento Grid Fluide
 * Zone sous la scène 3D : grille horizontale 60% SANTARAI NEURAL FEED | 40% ACTIVE AGENTS STATUS
 */
const DISPLAY_AGENTS_LIMIT = 4

export function DashboardQGV2() {
  const { user } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const { agents: inventoryAgents, refreshAgents } = useAgents()
  const syncAgentsFromSupabase = useDashboardStore((s) => s.syncAgentsFromSupabase)
  const boardroomOpen = useDashboardStore((s) => s.boardroomOpen)
  const setBoardroomOpen = useDashboardStore((s) => s.setBoardroomOpen)

  const agents = inventoryAgents ?? []
  const sceneAgents = useMemo(
    () =>
      agents.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status === "active" ? "Working" : "Standby",
        currentTask: null as string | null,
        progress: 0,
      })),
    [agents]
  )

  const missions = useDashboardStore((s) => s.missions)
  const tokens = useDashboardStore((s) => s.tokens)
  const prevAgentsLengthRef = useRef<number>(agents.length)
  const prevMissionsRef = useRef<{ id: string; status: string }[]>([])
  const prevTokensRef = useRef<number>(tokens)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevAgentsLengthRef.current = agents.length
      prevMissionsRef.current = missions.map((m) => ({ id: m.id, status: m.status }))
      prevTokensRef.current = tokens
      return
    }
    if (agents.length > prevAgentsLengthRef.current) {
      toast.success(t.dashboard.hq.notifications.hireSuccess, { position: "top-right" })
      prevAgentsLengthRef.current = agents.length
    }
    const completedIds = new Set(missions.filter((m) => m.status === "Completed").map((m) => m.id))
    const prevCompletedIds = new Set(prevMissionsRef.current.filter((p) => p.status === "Completed").map((p) => p.id))
    const inProgressIds = new Set(missions.filter((m) => m.status === "In Progress").map((m) => m.id))
    const prevInProgressIds = new Set(prevMissionsRef.current.filter((p) => p.status === "In Progress").map((p) => p.id))
    for (const id of completedIds) {
      if (!prevCompletedIds.has(id)) {
        toast.success(t.dashboard.hq.notifications.deliverableAvailable, { position: "top-right" })
        break
      }
    }
    for (const id of inProgressIds) {
      if (!prevInProgressIds.has(id)) {
        toast.info(t.dashboard.hq.notifications.missionStart, { position: "top-right" })
        break
      }
    }
    if (tokens !== prevTokensRef.current) {
      toast.success(t.dashboard.hq.notifications.treasuryUpdated, { position: "top-right" })
      prevTokensRef.current = tokens
    }
    prevMissionsRef.current = missions.map((m) => ({ id: m.id, status: m.status }))
  }, [agents.length, missions, tokens, t])

  useEffect(() => {
    if (!user?.id) return
    refreshAgents()
    syncAgentsFromSupabase(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshAgents/syncAgentsFromSupabase are stable; only run when user changes
  }, [user?.id])

  const handleProjectCreated = () => {
    if (user?.id) {
      syncAgentsFromSupabase(user.id)
      refreshAgents()
    }
  }

  const displayedAgents = agents.slice(0, DISPLAY_AGENTS_LIMIT)
  const remainingCount = Math.max(0, agents.length - DISPLAY_AGENTS_LIMIT)
  return (
    <div className="min-h-screen w-full p-6 lg:p-8 space-y-6">
      {/* Header avec Titre et Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">📊 {t.dashboard.hq.title}</h1>
          <p className="text-sm text-muted-foreground">{t.dashboard.hq.subtitle}</p>
        </div>
        <div className="flex-shrink-0">
          <StatsCards />
        </div>
      </div>

      {/* Barre de commande intelligente (Orchestrateur) */}
      <NeuralInput onProjectCreated={handleProjectCreated} />

      {/* Scène 3D - Full Width */}
      <div className="w-full">
        <div className="h-[500px] lg:h-[60vh] relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-gray-950/90 via-gray-900/80 to-gray-950/90 backdrop-blur-xl">
          <div className="relative h-full w-full">
            <LiveOfficeScene agents={sceneAgents} />
          </div>
        </div>
      </div>

      {boardroomOpen && (
        <BoardroomModal
          open={boardroomOpen}
          onClose={() => setBoardroomOpen(false)}
          agents={agents.map((a) => ({ id: a.id, name: a.name, role: a.role }))}
        />
      )}

      {/* Zone sous la scène : Grille horizontale 60% | 40% */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Colonne gauche (60%) : SANTARAI NEURAL FEED */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="rounded-xl overflow-hidden border border-green-500/20 bg-black flex flex-col max-h-64">
            <ActivityLogPanel />
          </div>
        </div>

        {/* Colonne droite (40%) : ACTIVE AGENTS STATUS */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="rounded-xl border border-cyan-500/20 bg-gray-900/50 p-4 flex flex-col max-h-64">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t.dashboard.hq.activeAgentsStatus}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {agents.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-8 px-4 text-center text-slate-500 text-sm">
                  <p className="font-medium">{t.dashboard.hq.noUnits}</p>
                  <p className="text-xs mt-1">{t.dashboard.hq.recruitmentRequired}</p>
                  <Link
                    href="/dashboard/recrutement"
                    className="mt-3 text-cyan-400 hover:text-cyan-300 text-xs font-semibold uppercase tracking-wider"
                  >
                    {t.dashboard.hq.goToRecruitment}
                  </Link>
                </div>
              ) : (
                <>
                  {displayedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-3 rounded-lg border ${
                        agent.status === "active"
                          ? "bg-green-900/20 border-green-500/50"
                          : "bg-slate-800 border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-gray-100">{agent.name}</h4>
                          <p className="text-xs text-gray-400">{agent.role}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{t.dashboard.hq.waitingOrders}</p>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            agent.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-600"
                          }`}
                        />
                      </div>
                      <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            agent.status === "active" ? "bg-green-500" : "bg-gray-500"
                          }`}
                          style={{ width: "0%" }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-400">
                          {agent.status === "active" ? "Working" : "Standby"}
                        </span>
                        <span className="text-[10px] text-gray-400">0%</span>
                      </div>
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <Link
                      href="/dashboard/agents"
                      className="col-span-2 p-3 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 text-center text-sm font-medium transition-colors"
                    >
                      {t.dashboard.hq.seeAll} (+{remainingCount})
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File d'attente - Full width sous la grille */}
      <div className="w-full">
        <TaskQueue />
      </div>
    </div>
  )
}
