'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'
import { Brain, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { UpsellModal, type UpsellSelection } from '@/components/modals/UpsellModal'
import { MissionBriefingModal, type MissionPlan } from '@/components/modals/MissionBriefingModal'
import { useDashboardStore } from '@/lib/store'
import { MARKET_CATALOG } from '@/lib/catalog'
import type { MarketCategory } from '@/lib/catalog'

type MissingRole = MarketCategory | 'LEGAL'

interface NeuralInputProps {
  onProjectCreated?: () => void | Promise<void>
}

export function NeuralInput({ onProjectCreated }: NeuralInputProps) {
  const router = useRouter()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [upsellOpen, setUpsellOpen] = useState(false)
  const [upsellData, setUpsellData] = useState<{ missing_roles: MissingRole[]; estimated_cost?: number }>({ missing_roles: [] })
  const [briefingOpen, setBriefingOpen] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<MissionPlan | null>(null)
  const fetchTreasury = useDashboardStore((s) => s.fetchTreasury)
  const recruitTeam = useDashboardStore((s) => s.recruitTeam)
  const syncAgentsFromSupabase = useDashboardStore((s) => s.syncAgentsFromSupabase)

  const handleExecute = useCallback(
    async (planOverride?: MissionPlan | null, selectedAgentIds?: string[]) => {
      const planToUse = planOverride ?? pendingPlan
      if (!planToUse || !user?.id || isExecuting) return
      setIsExecuting(true)
      toast.info(t.dashboard.neuralInput.deployInProgress, { id: 'execute', duration: 0 })
      try {
        const res = await fetch('/api/conductor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'execute',
            userId: user.id,
            plan: planToUse,
            ...(selectedAgentIds?.length ? { selectedAgentIds } : {}),
          }),
        })
        const json = await res.json().catch(() => ({}))
        toast.dismiss('execute')
        if (json.status === 'CREATED' && json.projectId) {
          const debitedAmount = Number(json.debitedAmount ?? 0)
          if (debitedAmount > 0) {
            useDashboardStore.getState().addTransaction(debitedAmount, 'DEBIT', 'Déploiement (agents + missions)')
          }
          await fetchTreasury(user.id)
          toast.success(t.dashboard.neuralInput.projectCreated)
          setBriefingOpen(false)
          setPendingPlan(null)
          setQuery('')
          onProjectCreated?.()

          // ── AUTO-EXÉCUTION : les agents démarrent immédiatement ──
          toast.info('⚡ Salariés au travail…', {
            description: 'Les agents exécutent vos tâches en arrière-plan.',
            duration: 4000,
          })
          fetch(`/api/projects/${json.projectId}/auto-execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).then(async (autoRes) => {
            if (autoRes.ok) {
              const autoData = await autoRes.json().catch(() => ({}))
              const count = autoData.executed ?? 0
              if (count > 0) {
                toast.success(`✅ ${count} tâche${count > 1 ? 's' : ''} exécutée${count > 1 ? 's' : ''} par vos salariés`, {
                  duration: 5000,
                })
              }
            }
          }).catch(() => {
            // Silencieux — l'auto-exec est un bonus, pas bloquant
          })

          router.push(`/dashboard/projects/${json.projectId}`)
        } else {
          const errorMessage = json.error ?? t.dashboard.neuralInput.deployError
          if (res.status === 402) {
            toast.error(t.dashboard.neuralInput.insufficientFunds, {
              description: errorMessage,
            })
          } else {
            toast.error(errorMessage, { description: res.status === 400 ? errorMessage : undefined })
          }
        }
      } catch (err) {
        toast.dismiss('execute')
        const message = err instanceof Error ? err.message : 'Erreur de déploiement'
        console.error('Détails de l\'erreur de déploiement :', err)
        console.error('Erreur complète Supabase :', JSON.stringify(err, null, 2))
        toast.error(message)
      } finally {
        setIsExecuting(false)
      }
    },
    [pendingPlan, user?.id, isExecuting, t, router, fetchTreasury, onProjectCreated]
  )

  function mergePlanWithSelections(plan: MissionPlan, selections: UpsellSelection): MissionPlan {
    const missions = (plan.missions ?? []).map((m) => {
      const name = m.agent_name ?? ''
      const catalogAgent = MARKET_CATALOG.find((c) => c.name.toUpperCase() === name.toUpperCase())
      const role: MissingRole | null = catalogAgent
        ? (catalogAgent.name === 'DAIMYO' ? 'LEGAL' : (catalogAgent.category as MissingRole))
        : null
      if (role && selections[role]) return { ...m, agent_name: selections[role].name }
      return m
    })
    const team = [...new Set(missions.map((m) => m.agent_name).filter(Boolean))] as string[]
    return { ...plan, missions, team }
  }

  const handleObjectiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || !user?.id || isLoading) return

    setIsLoading(true)
    toast.info(t.dashboard.neuralInput.analyzing, { id: 'conductor-check', duration: 0 })

    try {
      const res = await fetch('/api/conductor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'simulate',
          prompt: trimmed,
          objective: trimmed,
          userId: user.id,
        }),
      })
      const json = await res.json().catch(() => ({}))
      toast.dismiss('conductor-check')

      if (json.status === 'SIMULATED' && json.plan) {
        setPendingPlan(json.plan)
        setBriefingOpen(true)
        return
      }

      if (json.status === 'MISSING_RESOURCES' && Array.isArray(json.missing_roles)) {
        if (json.plan) setPendingPlan(json.plan)
        setUpsellData({
          missing_roles: json.missing_roles,
          estimated_cost: json.estimated_cost ?? 0,
        })
        setUpsellOpen(true)
        toast.info(t.dashboard.neuralInput.missingResources, { description: json.message })
        return
      }

      if (!res.ok) {
        toast.error(json.error ?? t.dashboard.neuralInput.analysisError)
      }
    } catch (err) {
      toast.dismiss('conductor-check')
      toast.error(t.dashboard.neuralInput.networkError, { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form
        onSubmit={handleObjectiveSubmit}
        className="relative w-full max-w-2xl mx-auto mb-6"
      >
        <div className="relative flex items-center rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(99,102,241,0.25)] focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] transition-all">
          <div className="absolute left-4 flex items-center justify-center pointer-events-none text-indigo-400">
            {isLoading ? (
              <Loader2 size={22} className="text-indigo-400/90 animate-spin" />
            ) : (
              <Brain size={22} className="text-indigo-400/90" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isLoading ? t.dashboard.neuralInput.analyzing : t.dashboard.neuralInput.placeholder}
            disabled={isLoading}
            className="w-full pl-12 pr-14 py-4 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm md:text-base disabled:opacity-70 disabled:cursor-wait"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 p-2.5 rounded-xl bg-indigo-600/80 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label={t.dashboard.neuralInput.send}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>

      <UpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        missingRoles={upsellData.missing_roles}
        estimatedCost={upsellData.estimated_cost}
        onDeployTeam={
          pendingPlan && user?.id
            ? async (selectedAgentIds, selections, totalCost) => {
                const result = await recruitTeam(selectedAgentIds, totalCost)
                if (!result.ok) {
                  toast.error(result.error)
                  return
                }
                setUpsellOpen(false)
                toast.success(t.dashboard.neuralInput.projectCreated ?? 'Équipe déployée.')
                await fetchTreasury(user.id)
                await syncAgentsFromSupabase(user.id)
                const mergedPlan = mergePlanWithSelections(pendingPlan, selections)
                handleExecute(mergedPlan, selectedAgentIds)
              }
            : undefined
        }
        isDeploying={isExecuting}
      />

      <MissionBriefingModal
        open={briefingOpen}
        onClose={() => { setBriefingOpen(false); setPendingPlan(null) }}
        plan={pendingPlan}
        onConfirm={() => handleExecute()}
        isExecuting={isExecuting}
      />
    </>
  )
}
