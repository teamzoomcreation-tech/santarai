'use client'

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAgents } from '@/contexts/agents-context'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'
import { useAuth } from '@/contexts/auth-context'
import { useDashboardStore, MARKET_CATALOG, type MarketCategory } from '@/lib/store'
import { QuickRecruitModal } from '@/components/dashboard/QuickRecruitModal'
import { UserPlus, Cpu, Check, Zap, Search } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORY_IDS: ('ALL' | MarketCategory)[] = ['ALL', 'MARKETING', 'TECH', 'SALES', 'ADMIN', 'DATA', 'ELITE']

function getCategoryStyle(category: MarketCategory) {
  switch (category) {
    case 'MARKETING':
      return {
        border: 'border-pink-500/50',
        text: 'text-pink-400',
        badge: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
        avatar: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
      }
    case 'TECH':
      return {
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        avatar: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      }
    case 'SALES':
      return {
        border: 'border-green-500/50',
        text: 'text-green-400',
        badge: 'bg-green-500/20 text-green-400 border-green-500/40',
        avatar: 'bg-green-500/20 border-green-500/30 text-green-400',
      }
    case 'ADMIN':
      return {
        border: 'border-slate-500/50',
        text: 'text-slate-400',
        badge: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
        avatar: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
      }
    case 'DATA':
      return {
        border: 'border-cyan-500/50',
        text: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        avatar: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
      }
    case 'ELITE':
      return {
        border: 'border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
        text: 'text-yellow-400',
        badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        avatar: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
      }
    default:
      return {
        border: 'border-slate-600/50',
        text: 'text-slate-400',
        badge: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
        avatar: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
      }
  }
}

function RecrutementContent() {
  const { user } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const tokens = useDashboardStore((s) => s.tokens)
  const agents = useDashboardStore((s) => s.agents)
  const recruitAgent = useDashboardStore((s) => s.recruitAgent)
  const syncAgentsFromSupabase = useDashboardStore((s) => s.syncAgentsFromSupabase)
  const { refreshAgents } = useAgents()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<'ALL' | MarketCategory>('ALL')
  const [search, setSearch] = useState('')
  const [pendingRecruit, setPendingRecruit] = useState<(typeof MARKET_CATALOG)[number] | null>(null)

  useEffect(() => {
    const filterParam = searchParams.get('filter') as MarketCategory | null
    if (filterParam && ['MARKETING', 'TECH', 'SALES', 'ADMIN', 'DATA', 'ELITE'].includes(filterParam)) {
      setFilter(filterParam)
    }
  }, [searchParams])

  const filteredCatalog = useMemo(() => {
    let list = MARKET_CATALOG
    if (filter !== 'ALL') {
      list = list.filter((item) => item.category === filter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) || item.role.toLowerCase().includes(q)
      )
    }
    return list
  }, [filter, search])

  const isOwned = (agentId: string) => agents.some((a) => a.id === agentId)

  const handleRecruit = async (item: (typeof MARKET_CATALOG)[number]) => {
    const result = await recruitAgent(item)
    if (result === 'SUCCESS') {
      await refreshAgents()
      if (user?.id) syncAgentsFromSupabase(user.id)
      toast.success(t.dashboard.recruitment.welcomeToast.replace('{name}', item.name))
    } else if (typeof result === 'object' && result.status === 'INSUFFICIENT_FUNDS') {
      const manque = Math.max(0, result.missing)
      toast.error(t.dashboard.recruitment.insufficientFundsMsg.replace('{amount}', manque.toLocaleString()))
    } else {
      toast.error(t.dashboard.recruitment.allocateError)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-24">
      <div className="p-4 md:p-8 space-y-8">
        {/* HEADER + SOLDE */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 mb-2">
              <UserPlus size={32} className="text-indigo-400" />
              {t.dashboard.recruitment.title}
            </h1>
            <p className="text-slate-400 text-sm">
              {t.dashboard.recruitment.agenciesDesc}
            </p>
          </div>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 rounded-xl px-6 py-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] font-mono">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-1">
              {t.dashboard.recruitment.balance}
            </p>
            <p className="text-3xl md:text-4xl font-bold text-cyan-400 tabular-nums flex items-center gap-2">
              <Cpu size={28} className="text-cyan-500" />
              {tokens.toLocaleString()} TK
            </p>
            <p className="text-xs text-slate-500 mt-1">{t.dashboard.recruitment.computeTokens}</p>
          </div>
        </div>

        {/* BARRE D'OUTILS : Recherche + Onglets */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder={t.dashboard.recruitment.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_IDS.map((catId) => {
              const label = catId === 'ALL' ? t.dashboard.recruitment.categories.all
                : catId === 'MARKETING' ? t.dashboard.recruitment.categories.marketing
                : catId === 'TECH' ? t.dashboard.recruitment.categories.tech
                : catId === 'SALES' ? t.dashboard.recruitment.categories.sales
                : catId === 'ADMIN' ? t.dashboard.recruitment.categories.admin
                : catId === 'DATA' ? t.dashboard.recruitment.categories.data
                : t.dashboard.recruitment.categories.elite
              return (
                <button
                  key={catId}
                  type="button"
                  onClick={() => setFilter(catId)}
className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm md:text-base font-bold uppercase tracking-wider border transition-all ${
                      filter === catId
                        ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                        : 'bg-slate-900/80 text-slate-400 border-slate-600 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* GRILLE MARKETPLACE - Cartes avec code couleur */}
        <div>
            <h2 className="text-lg font-bold text-slate-300 uppercase tracking-wider mb-4">
            {t.dashboard.recruitment.marketplace} {filteredCatalog.length < MARKET_CATALOG.length && `(${filteredCatalog.length} / ${MARKET_CATALOG.length})`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCatalog.map((item) => {
              const owned = isOwned(item.id)
              const style = getCategoryStyle(item.category)
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/80 border rounded-2xl p-6 flex flex-col hover:border-opacity-80 transition-all shadow-xl ${style.border}`}
                >
                  {/* Badge catégorie (Pill) */}
                  <span
                    className={`inline-flex self-start mb-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${style.badge}`}
                  >
                    {item.category}
                  </span>
                  {/* Avatar */}
                  <div
                    className={`w-16 h-16 rounded-xl border flex items-center justify-center text-2xl font-bold mb-4 ${style.avatar}`}
                  >
                    {item.avatar}
                  </div>
                  {/* Nom + Rôle */}
                  <h3 className={`text-lg font-bold mb-1 ${style.text}`}>{item.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {item.role}
                  </p>
                  <p className="text-sm text-slate-400 flex-1 mb-4 line-clamp-3">
                    {item.description}
                  </p>
                  {/* Coût mensuel en TK */}
                  <p className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-1.5 font-mono">
                    <Zap size={16} className="text-amber-500" />
                    {item.monthlyCost.toLocaleString()} TK <span className="text-slate-500 font-normal text-sm">{t.dashboard.recruitment.perMonth}</span>
                  </p>
                  {/* Bouton */}
                  <button
                    type="button"
                    onClick={() => (owned || tokens < item.monthlyCost ? undefined : setPendingRecruit(item))}
                    disabled={owned || tokens < item.monthlyCost}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      owned
                        ? 'bg-slate-700 text-slate-500 border border-slate-600 cursor-not-allowed'
                        : tokens < item.monthlyCost
                          ? 'bg-slate-800 text-slate-500 border border-slate-600 cursor-not-allowed'
                          : 'bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {owned ? (
                      <>
                        <Check size={18} />
                        {t.dashboard.recruitment.alreadyOwned}
                      </>
                    ) : tokens < item.monthlyCost ? (
                      <>
                        <Cpu size={18} />
                        {t.dashboard.recruitment.insufficientBalance}
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        {t.dashboard.recruitment.allocateResources}
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
          {filteredCatalog.length === 0 && (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-700 rounded-xl">
              {t.dashboard.recruitment.noResults}
            </div>
          )}
        </div>
      </div>

      {pendingRecruit && (
        <QuickRecruitModal
          agent={pendingRecruit}
          onClose={() => setPendingRecruit(null)}
          onRecruit={async () => {
            await handleRecruit(pendingRecruit)
            setPendingRecruit(null)
          }}
        />
      )}
    </div>
  )
}

function RecrutementLoadingFallback() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400">
      {t.dashboard.common.loading}
    </div>
  )
}

export default function RecrutementPage() {
  return (
    <Suspense fallback={<RecrutementLoadingFallback />}>
      <RecrutementContent />
    </Suspense>
  )
}
