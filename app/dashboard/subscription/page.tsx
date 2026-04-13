'use client'

import React, { useState } from 'react'
import { Check, Zap, Crown, Rocket, Sparkles, Loader2 } from 'lucide-react'
import { useDashboardStore, type SubscriptionTier } from '@/lib/store'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'
import { toast } from 'sonner'

const PLAN_CONFIG: Array<{ tier: SubscriptionTier; name: string; icon: typeof Zap; color: string; popular: boolean }> = [
  { tier: 'STARTER', name: 'Starter', icon: Zap, color: 'from-blue-500 to-cyan-500', popular: false },
  { tier: 'PRO', name: 'Pro', icon: Crown, color: 'from-purple-500 to-pink-500', popular: true },
  { tier: 'ENTERPRISE', name: 'Enterprise', icon: Rocket, color: 'from-orange-500 to-red-500', popular: false },
]

const PRICES: Record<SubscriptionTier, number> = { FREE: 0, STARTER: 14.9, PRO: 49, ENTERPRISE: 129 }

const LIMITS = {
  FREE: { agents: 0, tokens: 25_000, projects: 1 },
  STARTER: { agents: 5, tokens: 500_000, projects: 50 },
  PRO: { agents: 20, tokens: 2_500_000, projects: 200 },
  ENTERPRISE: { agents: 999, tokens: 15_000_000, projects: 999 },
} as const

export default function SubscriptionPage() {
  const { currentLang } = useLanguage()
  const t = (translations[currentLang] ?? translations.fr) as typeof translations.fr
  const pt = t.pricing
  const subscriptionTier = useDashboardStore((s) => s.subscriptionTier)
  const agents = useDashboardStore((s) => s.agents)
  const missions = useDashboardStore((s) => s.missions)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const currentLimits = LIMITS[subscriptionTier] ?? LIMITS.STARTER
  const usedAgents = agents.length
  const totalSpent = missions.reduce((acc, m) => acc + (m.cost ?? 0), 0)
  const totalProjects = missions.length

  const agentsPercent = Math.min((usedAgents / currentLimits.agents) * 100, 100)
  const tokensPercent = Math.min((totalSpent / currentLimits.tokens) * 100, 100)
  const projectsPercent = Math.min((totalProjects / currentLimits.projects) * 100, 100)

  const handleCheckout = async (
    plan: SubscriptionTier,
    price: number,
    tokens: number
  ) => {
    if (plan === subscriptionTier) return
    setLoadingPlan(plan)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: price,
          planName: plan,
          tokensAmount: tokens,
        }),
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Vérifiez votre clé Stripe dans .env.local')
        setLoadingPlan(null)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur de connexion au serveur de paiement.')
      setLoadingPlan(null)
    }
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#020617] text-white pb-24">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-sm font-bold text-indigo-400">{pt.header.currentPlan} : {subscriptionTier}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{pt.header.title}</h1>
          <p className="text-slate-400 text-base md:text-lg">{pt.header.subtitle}</p>
        </div>

        {/* GRILLE PLANS (RESPONSIVE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLAN_CONFIG.map((plan) => {
            const Icon = plan.icon
            const isCurrent = subscriptionTier === plan.tier
            const isLoading = loadingPlan === plan.tier
            const p = plan.tier === 'STARTER' ? pt.starter : plan.tier === 'PRO' ? pt.pro : pt.enterprise
            const buttonLabel = plan.tier === 'STARTER' ? (p as any).buttonChoose : (p as any).buttonUpgrade

            return (
              <div
                key={plan.tier}
                className={`relative bg-slate-900/50 border rounded-2xl p-6 md:p-8 transition-all ${
                  plan.popular
                    ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)] md:scale-105'
                    : 'border-white/5 hover:border-white/20'
                } ${isCurrent ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                    {pt.badges.recommended.toUpperCase()}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    {pt.badges.current.toUpperCase()}
                  </div>
                )}

                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon size={28} className="text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-1">{p.tagline}</p>
                <div className="mb-2">
                  <span className="text-4xl md:text-5xl font-bold" dir="ltr">{p.priceLabel}</span>
                </div>
                <div className="text-cyan-400 font-medium text-sm mb-6">{p.tokenLabel}</div>

                <ul className="space-y-3 mb-6">
                  {p.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={16} className="text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  id={`btn-${plan.tier}`}
                  onClick={() =>
                    handleCheckout(plan.tier, PRICES[plan.tier], LIMITS[plan.tier].tokens)
                  }
                  className={`w-full h-14 md:h-12 py-3 rounded-xl font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-400 cursor-default border border-white/10'
                      : plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10 active:scale-95'
                  }`}
                  disabled={isCurrent || loadingPlan !== null}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {pt.loading}
                    </>
                  ) : isCurrent ? (
                    pt.planCurrent
                  ) : (
                    buttonLabel
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* SECTION USAGE */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6">{pt.usage.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>{pt.usage.agentsActive}</span>
                <span className="text-white font-bold">
                  {usedAgents} / {currentLimits.agents === 999 ? '∞' : currentLimits.agents}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${agentsPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>{pt.usage.tokensConsumed}</span>
                <span className="text-white font-bold">
                  {totalSpent.toLocaleString()} / {currentLimits.tokens >= 10_000_000 ? '∞' : currentLimits.tokens.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${tokensPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>{pt.usage.missionsProjects}</span>
                <span className="text-white font-bold">
                  {totalProjects} / {currentLimits.projects === 999 ? '∞' : currentLimits.projects}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${projectsPercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
