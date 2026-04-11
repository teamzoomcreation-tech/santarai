'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAgents } from '@/contexts/agents-context'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'
import { useAuth } from '@/contexts/auth-context'
import { useDashboardStore } from '@/lib/store'
import { useAgentStore } from '@/stores/useAgentStore'
import type { Agent } from '@/data/marketAgents'
import { getAgentTheme } from '@/lib/agentTheme'
import { MessageCircle, Activity, Zap, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

function mapDashboardAgentToChatAgent(agent: {
  id: string
  name: string
  role: string
  userDirectives?: string
  customDirective?: string
}): Agent {
  const defaultPrompt = `Tu es ${agent.name}, ${agent.role}. Tu exécutes les ordres de l'utilisateur avec précision.`
  const surcouche = (agent.userDirectives ?? agent.customDirective)?.trim()
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    category: '',
    description: '',
    price: 0,
    tokens: 0,
    systemPrompt: surcouche ? `${defaultPrompt}\n\n[Directives opérationnelles à respecter : ${surcouche}]` : defaultPrompt,
  }
}

type AgentDisplay = { id: string; name: string; role: string; status: string; customDirective?: string; userDirectives?: string }

export default function MyAgentsPage() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const { agents: contextAgents, removeAgent: contextRemoveAgent } = useAgents()
  const agents = contextAgents ?? []
  const dashboardAgents = useDashboardStore((s) => s.agents)
  const terminateContract = useDashboardStore((s) => s.terminateContract)
  const syncAgentsFromSupabase = useDashboardStore((s) => s.syncAgentsFromSupabase)
  const updateAgentDirectives = useDashboardStore((s) => s.updateAgentDirectives)
  const setSelectedAgent = useAgentStore((s) => s.setSelectedAgent)
  const { user } = useAuth()

  const [configuringAgent, setConfiguringAgent] = useState<AgentDisplay | null>(null)
  const [directiveInput, setDirectiveInput] = useState('')

  const handleOpenChannel = (agent: { id: string; name: string; role: string }) => {
    const dashboardAgent = dashboardAgents.find((a) => a.id === agent.id)
    const directive = dashboardAgent?.userDirectives ?? dashboardAgent?.customDirective
    setSelectedAgent(mapDashboardAgentToChatAgent({ ...agent, userDirectives: directive, customDirective: directive }))
  }

  const handleRelease = async (agentId: string, agentName: string) => {
    if (!window.confirm(`${t.dashboard.agents.releaseConfirm} ${agentName} ?`)) return
    try {
      await contextRemoveAgent(agentId)
      terminateContract(agentId)
      if (user?.id) syncAgentsFromSupabase(user.id)
    } catch (e) {
      toast.error(t.dashboard.toast.releaseError)
    }
  }

  const openConfig = (agent: AgentDisplay) => {
    setConfiguringAgent(agent)
    setDirectiveInput(agent.customDirective ?? '')
  }

  const closeConfig = () => {
    setConfiguringAgent(null)
    setDirectiveInput('')
  }

  const handleSaveDirective = () => {
    if (!configuringAgent) return
    updateAgentDirectives(configuringAgent.id, directiveInput)
    setConfiguringAgent(null)
    setDirectiveInput('')
    toast.success(t.dashboard.toast.directivesUpdated)
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#020617] text-white pb-24">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t.dashboard.agents.title}</h1>
        <p className="text-sm md:text-base text-slate-400">{t.dashboard.agents.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {agents.map((agent) => {
          const theme = getAgentTheme(agent.id)
          const isWorking = agent.status === 'active'
          return (
            <div
              key={agent.id}
              className="bg-[#0B0F1A] border border-white/5 rounded-2xl p-5 md:p-6 relative overflow-hidden group hover:border-white/10 transition-all"
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${theme?.hex ?? '#6366f1'}, transparent 70%)` }}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-2xl md:text-3xl font-bold text-black shadow-lg flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${theme?.hex ?? '#6366f1'}, ${theme?.hex ?? '#6366f1'}88)` }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg md:text-xl mb-1 truncate">{agent.name}</h3>
                      <p className="text-xs text-slate-400 truncate">{agent.role}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded ${
                            isWorking ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/30 text-slate-400'
                          }`}
                        >
                          <Activity size={10} />
                          {agent.status === 'active' ? t.dashboard.agents.statusWorking : agent.status === 'idle' ? t.dashboard.agents.statusStandby : agent.status}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">
                          {t.dashboard.agents.level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Barre XP visuelle (Niveau 1 = 0%) */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>XP</span>
                    <span>0 / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenChannel(agent)}
                    className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <MessageCircle size={18} />
                    {t.dashboard.agents.openChannel}
                  </button>
                  <button
                    type="button"
                    onClick={() => openConfig(agent)}
                    className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-slate-500/30 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 hover:text-slate-300 transition-all active:scale-[0.98]"
                    title={t.dashboard.agents.protocolTitle}
                  >
                    <span className="text-base" aria-hidden>⚙️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRelease(agent.id, agent.name)}
                    className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all active:scale-[0.98]"
                    title={t.dashboard.agents.releaseTitle}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {agents.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-500 mb-2 text-lg">{t.dashboard.agents.noAgents}</p>
          <p className="text-sm text-slate-500 mb-4">{t.dashboard.agents.noAgentsDesc}</p>
          <Link
            href="/dashboard/recrutement"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors"
          >
            <Zap size={16} />
            {t.dashboard.agents.goToRecruitment}
          </Link>
        </div>
      )}

      {/* MODAL PROTOCOLE (Surcouche de Directives — Noyau jamais exposé) */}
      {configuringAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeConfig}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">
              ⚙️ {t.dashboard.agents.protocol} <span className="text-blue-400">{configuringAgent.name}</span>
            </h3>

            <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs font-medium">
              {t.dashboard.agents.systemCore}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                {t.dashboard.agents.directives}
              </label>
              <textarea
                className="w-full h-32 bg-black/50 border border-slate-700 rounded-lg p-3 text-slate-200 focus:border-blue-500 outline-none text-sm resize-none"
                placeholder={t.dashboard.agents.directivesPlaceholder}
                value={directiveInput}
                onChange={(e) => setDirectiveInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfig}
                className="px-4 py-3 min-h-[44px] text-slate-400 hover:text-white transition-colors"
              >
                {t.dashboard.agents.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveDirective}
                className="px-4 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
              >
                {t.dashboard.agents.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
