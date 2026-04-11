"use client"

import { useMemo } from "react"
import { TrendingUp, Clock, Target, Zap, ArrowUpRight } from "lucide-react"
import { useDashboardStore } from "@/lib/store"
import { useAgentStore } from "@/stores/useAgentStore"

export function ProductivityWidget() {
  const missions = useDashboardStore((s) => s.missions)
  const agents = useDashboardStore((s) => s.agents)
  const tokens = useDashboardStore((s) => s.tokens)
  const tasks = useAgentStore((s) => s.tasks ?? [])

  const stats = useMemo(() => {
    const completed = missions.filter((m) => m.status === "Completed").length
    const failed = missions.filter((m) => m.status === "Failed").length
    const total = missions.length
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const tasksCompleted = tasks.filter((t) => t.status === "done").length
    const hoursSaved = tasksCompleted * 2.5 + completed * 1.5
    const activeAgents = agents.filter((a) => a.status === "Working").length
    const tokensConsumed = missions.reduce((acc, m) => acc + (m.cost ?? 0), 0)

    // Estimation ROI : 1 TK consommé = environ 0.0002€ de valeur produite (hypothèse conservative)
    const estimatedValueEur = Math.round(tokensConsumed * 0.0002 + hoursSaved * 45) // 45€/h de coût évité

    return { completed, failed, total, successRate, hoursSaved, activeAgents, tokensConsumed, estimatedValueEur }
  }, [missions, agents, tasks])

  const kpis = [
    {
      label: "Missions réussies",
      value: stats.completed,
      total: stats.total || 1,
      icon: Target,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      bar: "bg-emerald-500",
      suffix: `/ ${stats.total}`,
    },
    {
      label: "Taux de succès",
      value: stats.successRate,
      total: 100,
      icon: TrendingUp,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      bar: "bg-indigo-500",
      suffix: "%",
    },
    {
      label: "Heures économisées",
      value: Math.round(stats.hoursSaved * 10) / 10,
      total: Math.max(stats.hoursSaved, 10),
      icon: Clock,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      bar: "bg-cyan-500",
      suffix: "h",
    },
    {
      label: "Agents actifs",
      value: stats.activeAgents,
      total: Math.max(agents.length, 1),
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      bar: "bg-amber-500",
      suffix: `/ ${agents.length}`,
    },
  ]

  return (
    <div className="rounded-xl border border-white/5 bg-gray-900/30 p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Productivité & ROI</h3>
          <p className="text-xs text-slate-500 mt-0.5">Semaine en cours</p>
        </div>
        {stats.estimatedValueEur > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ArrowUpRight size={12} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">+{stats.estimatedValueEur}€ estimés</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const pct = Math.min((kpi.value / kpi.total) * 100, 100)
          return (
            <div key={kpi.label} className="space-y-2">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <Icon size={14} className={kpi.color} />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</span>
                  <span className="text-xs text-slate-500">{kpi.suffix}</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">{kpi.label}</div>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${kpi.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
