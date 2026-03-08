"use client"

import { useDashboardStore } from "@/lib/store"
import { useAgentStore } from "@/stores/useAgentStore"
import { useEffect, useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Cpu, TrendingUp } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"

const QUOTA_MAX_TRESORERIE = 500_000 // Référence visuelle barre (Starter)

export function StatsCards() {
  const { agents, tokens, treasuryLoading } = useDashboardStore()
  const tasks = useAgentStore((s) => s.tasks ?? [])
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr

  // Gain de Productivité : lié au nombre de tâches terminées (session / store)
  // Synergie (KPI) : lié au nombre de départements actifs = agents ayant au moins une tâche en cours
  const { timeSaved, synergyIndex } = useMemo(() => {
    const completedTasksCount = tasks.filter((task) => task.status === "done").length
    const saved = completedTasksCount * 2.5 // 2.5h gagnées par tâche terminée
    const activeDepartmentIds = new Set(
      tasks.filter((task) => task.status === "progress").map((task) => task.assignedTo)
    )
    const activeCount = activeDepartmentIds.size
    const raw = 50 + activeCount * 15 // 50% de base + 15% par département actif, plafond 100%
    return { timeSaved: saved, synergyIndex: Math.min(raw, 100) }
  }, [tasks])

  const [displayTimeSaved, setDisplayTimeSaved] = useState(timeSaved)
  const [displayTokens, setDisplayTokens] = useState(tokens)
  const [displaySynergy, setDisplaySynergy] = useState(synergyIndex)
  const prevTokensRef = useRef(tokens)
  const [debitFlash, setDebitFlash] = useState<{ amount: number; key: number } | null>(null)

  // Animation de compteur pour le temps économisé
  useEffect(() => {
    const diff = timeSaved - displayTimeSaved
    if (Math.abs(diff) < 0.1) return

    const steps = 20
    const increment = diff / steps
    let current = displayTimeSaved
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplayTimeSaved(timeSaved)
        clearInterval(timer)
      } else {
        setDisplayTimeSaved(Math.round(current * 10) / 10)
      }
    }, 20)

    return () => clearInterval(timer)
  }, [timeSaved, displayTimeSaved])

  // Animation de compteur pour la trésorerie (TK) + flash débit
  useEffect(() => {
    const prev = prevTokensRef.current
    if (tokens < prev && prev > 0) {
      setDebitFlash({ amount: prev - tokens, key: Date.now() })
      setTimeout(() => setDebitFlash(null), 2200)
    }
    prevTokensRef.current = tokens

    const diff = tokens - displayTokens
    if (diff === 0) return

    const steps = 20
    const increment = diff / steps
    let current = displayTokens
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplayTokens(tokens)
        clearInterval(timer)
      } else {
        setDisplayTokens(Math.round(current))
      }
    }, 20)

    return () => clearInterval(timer)
  }, [tokens, displayTokens])

  // Animation de compteur pour l'indice de synergie
  useEffect(() => {
    const diff = synergyIndex - displaySynergy
    if (Math.abs(diff) < 0.1) return

    const steps = 20
    const increment = diff / steps
    let current = displaySynergy
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplaySynergy(synergyIndex)
        clearInterval(timer)
      } else {
        setDisplaySynergy(Math.round(current * 10) / 10)
      }
    }, 20)

    return () => clearInterval(timer)
  }, [synergyIndex, displaySynergy])

  return (
    <div className="flex flex-wrap gap-3">
      {/* Carte 1 : Gain de Productivité */}
      <div className="bg-gray-900/80 backdrop-blur-md border border-cyan-500/30 rounded-lg px-4 py-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-3">
        <Clock className="h-5 w-5 text-cyan-400" />
        <div>
          <div className="text-xs text-cyan-400 font-medium">{t.dashboard.stats.productivity}</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {displayTimeSaved.toFixed(1)}h
          </div>
        </div>
      </div>

      {/* Carte 2 : Trésorerie Allouée (TK) */}
      <div className="bg-gray-900/80 backdrop-blur-md border border-violet-500/30 rounded-lg px-4 py-2 shadow-[0_0_15px_rgba(139,92,246,0.25)] flex items-center gap-3 min-w-[200px] relative overflow-visible">
        <AnimatePresence>
          {debitFlash && (
            <motion.div
              key={debitFlash.key}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 28, opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute left-1/2 top-0 -translate-x-1/2 z-10 pointer-events-none text-red-400 font-bold text-sm tabular-nums whitespace-nowrap drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]"
            >
              -{debitFlash.amount.toLocaleString()} TK
            </motion.div>
          )}
        </AnimatePresence>
        <Cpu className="h-5 w-5 text-violet-400" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-violet-400 font-medium mb-1">{t.dashboard.stats.treasuryAllocated}</div>
          <div className="text-2xl font-bold text-white tabular-nums mb-1">
            {treasuryLoading ? "—" : `${displayTokens.toLocaleString()} TK`}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (displayTokens / QUOTA_MAX_TRESORERIE) * 100)}%` }}
              title={`${displayTokens.toLocaleString()} / ${QUOTA_MAX_TRESORERIE.toLocaleString()} TK`}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{t.dashboard.stats.quotaAvailable}</div>
        </div>
      </div>

      {/* Carte 3 : Indice de Synergie (KPI) */}
      <div className="bg-gray-900/80 backdrop-blur-md border border-amber-500/30 rounded-lg px-4 py-2 shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center gap-3 min-w-[200px]">
        <TrendingUp className="h-5 w-5 text-amber-400" />
        <div className="flex-1">
          <div className="text-xs text-amber-400 font-medium mb-1">{t.dashboard.stats.synergyIndex}</div>
          <div className="text-2xl font-bold text-white tabular-nums mb-1">
            {Math.min(displaySynergy, 100).toFixed(1)}%
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
              style={{ width: `${Math.min(displaySynergy, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
