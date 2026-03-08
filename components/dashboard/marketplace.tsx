'use client'

import React, { useState, useMemo } from 'react'
import { Search, Plus, Check, TrendingUp, Users, DollarSign } from 'lucide-react'
import { MARKET_AGENTS } from '@/data/marketAgents'
import { getAgentTheme } from '@/lib/agentTheme'
import { useAgents } from '@/contexts/agents-context'

const CATEGORIES = ['Tous', 'Marketing', 'Tech', 'Vente', 'Finance', 'RH', 'Créatif', 'Direction', 'Support']

// Exports pour compatibilité avec les anciens imports
export interface AgentProfile {
  id: string
  name: string
  description: string
  cost: string
  icon: any
  color: string
}

export const availableProfiles: AgentProfile[] = []

export function Marketplace({ onOpenRecruitDialog, onRecruitSuccess }: { onOpenRecruitDialog?: () => void; onRecruitSuccess?: () => void }) {
  return <RecruitmentView />
}

export default function RecruitmentView() {
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [searchQuery, setSearchQuery] = useState('')
  const { agents: myAgents, addAgent } = useAgents()

  const filteredAgents = useMemo(() => {
    // Sécurité si MARKET_AGENTS est vide ou undefined
    const source = MARKET_AGENTS || []
    return source.filter(agent => {
      const matchesCategory = selectedCategory === 'Tous' || agent.category === selectedCategory
      const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            agent.role.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const isAgentHired = (agentId: string) => {
    return myAgents.some(a => a.id === agentId)
  }

  const handleRecruit = async (agent: any) => {
    try {
      await addAgent({
        name: agent.name,
        role: agent.role,
        status: 'idle',
        avatar: { color: getAgentTheme(agent.id || agent).hex },
        tasksCompleted: 0,
        efficiency: 85,
      })
    } catch (error) {
      console.error('Erreur lors du recrutement:', error)
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6 text-white">
      {/* BANDEAU MARKET INSIGHTS */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp size={100} /></div>
           <h2 className="text-2xl font-bold text-white mb-2">Marché des Talents IA</h2>
           <p className="text-indigo-200 text-sm mb-4">40+ agents spécialisés prêts au déploiement.</p>
           <div className="flex gap-3">
              <span className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-xs text-indigo-300">+12 Nouveaux</span>
              <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300">98% Dispo</span>
           </div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase"><Users size={14} /> Effectif</div>
           <div className="text-3xl font-bold text-white">{(MARKET_AGENTS || []).length}</div>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
           <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase"><DollarSign size={14} /> Coût Moyen</div>
           <div className="text-3xl font-bold text-white">$650<span className="text-sm font-normal text-slate-500">/m</span></div>
        </div>
      </div>

      {/* BARRE FILTRES */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6 justify-between items-center sticky top-0 bg-[#020617]/95 z-20 py-2 backdrop-blur-md border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat, index) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap animate-fade-in-scale ${
                selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
              }`}
              style={{ animationDelay: `${index * 30}ms` }}>
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full xl:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 transition-all" />
        </div>
      </div>

      {/* GRILLE AGENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
        {filteredAgents.map((agent, index) => {
          const theme = getAgentTheme(agent.id || agent)
          const isHired = isAgentHired(agent.id)
          return (
            <div key={agent.id}
              className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 15}ms`,
                boxShadow: `0 0 0 1px inset ${selectedCategory !== 'Tous' ? theme.hex + '20' : 'transparent'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 1px inset ${theme.hex}40, 0 10px 30px -10px ${theme.glow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 1px inset ${selectedCategory !== 'Tous' ? theme.hex + '20' : 'transparent'}`
              }}>
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: theme.glow }} />
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{ background: theme.hex, color: '#000' }}>{agent.name.charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{agent.name}</h3>
                    <p className="text-[10px] font-mono uppercase" style={{ color: theme.hex }}>{agent.role}</p>
                  </div>
                </div>
                <div className="text-sm font-bold">${agent.price}</div>
              </div>
              
              <p className="text-xs text-slate-400 h-10 line-clamp-2 mb-4">{agent.description}</p>
              
              <button onClick={() => !isHired && handleRecruit(agent)} disabled={isHired}
                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isHired ? 'bg-slate-800 text-slate-500 cursor-default' : 'bg-white text-black hover:bg-slate-200 hover:scale-105 active:scale-95'
                }`}>
                {isHired ? <><Check className="w-3 h-3" /> Recruté</> : <><Plus className="w-3 h-3" /> Recruter</>}
              </button>
            </div>
          )
        })}
      </div>

      {/* Message si aucun résultat */}
      {filteredAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">Aucun agent trouvé</h3>
          <p className="text-slate-500 text-sm">Essayez de modifier vos filtres ou votre recherche</p>
        </div>
      )}
    </div>
  )
}
