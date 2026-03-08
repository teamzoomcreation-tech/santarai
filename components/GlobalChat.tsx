'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useAgentStore } from '@/stores/useAgentStore'
import { useDashboardStore, type Agent } from '@/lib/store'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { MARKET_CATALOG } from '@/lib/catalog'
import { MARKET_AGENTS, type Agent as MarketAgent } from '@/data/marketAgents'
import { getAgentTheme } from '@/lib/agentTheme'
import { getAgentPersonality, isEliteAgent } from '@/lib/agent-personalities'
import { X, Send, ArrowLeft, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

const SYSTEM_AGENT = {
  id: 'system',
  name: 'SANTARAI SYSTEM',
  role: 'Intelligence Centrale',
  systemPrompt:
    'Tu es le système central SANTARAI. Tu es calme, analytique et tu aides à gérer la plateforme.',
} as const

/** Agent minimal requis par GlobalChat : Agent catalogue, SYSTEM_AGENT, ou forme compatible */
export type GlobalChatAgent = { id: string; name: string; role: string; systemPrompt?: string }

export interface GlobalChatProps {
  agent?: GlobalChatAgent | null
  onClose?: () => void
  onResetAgent?: () => void
  isFloating?: boolean
  /** Si fourni, la conversation est liée à un projet : on enregistre une entrée "mission" pour les Archives. Sinon (chat simple), aucune mission n'est créée. */
  projectId?: string | null
}

function dashboardAgentToChatShape(a: {
  id: string
  name: string
  role: string
  userDirectives?: string
  customDirective?: string
}) {
  const defaultPrompt = `Tu es ${a.name}, ${a.role}. Tu exécutes les ordres de l'utilisateur.`
  const surcouche = (a.userDirectives ?? a.customDirective)?.trim()
  const systemPrompt = surcouche
    ? `${defaultPrompt}\n\n[Directives opérationnelles à respecter : ${surcouche}]`
    : defaultPrompt
  return { id: a.id, name: a.name, role: a.role, systemPrompt }
}

export default function GlobalChat({ agent, onClose, onResetAgent, isFloating, projectId }: GlobalChatProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const { selectedAgent, setSelectedAgent, isChatOpen, setChatOpen } = useAgentStore()
  const dashboardAgents = useDashboardStore((s) => s.agents)
  const settings = useDashboardStore((s) => s.settings)
  const effectiveAgent = agent ?? selectedAgent ?? SYSTEM_AGENT
  const currentAgent = effectiveAgent?.id && effectiveAgent.id !== 'system'
    ? (dashboardAgents.find((a) => a.id === effectiveAgent.id) as Agent | undefined)
    : null
  const chatSelectableAgents = [SYSTEM_AGENT, ...dashboardAgents.map(dashboardAgentToChatShape)]
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentMissionIdRef = useRef<string | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)

  // 3 STATES LOCAUX (Mode manuel pur)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Ouvrir le widget quand le store demande (ex: clic header MessageSquare)
  useEffect(() => {
    if (isChatOpen) setIsOpen(true)
  }, [isChatOpen])

  // Détecter si on est sur mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 768)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Initialiser la position au montage (côté client uniquement)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Desktop: bottom-right, Mobile: bottom-sheet style
      setPosition({ 
        x: isMobile ? 0 : window.innerWidth - 420, 
        y: isMobile ? window.innerHeight - 500 : 100 
      })
    }
  }, [isMobile])

  // Scroll automatique vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Au changement d'agent : greeting + injection message initial (orchestrateur) ; réinitialise la mission en cours
  useEffect(() => {
    const agentId = effectiveAgent?.id
    currentMissionIdRef.current = null
    if (!agentId || agentId === 'system') {
      setMessages([])
      setInput('')
      return
    }
    const toInject = useAgentStore.getState().initialChatMessage?.trim()
    const personality = getAgentPersonality(agentId)
    const greetingMsg = { role: 'assistant' as const, content: personality.greeting }
    const withInitial = toInject
      ? [greetingMsg, { role: 'user' as const, content: toInject }]
      : [greetingMsg]
    setMessages(withInitial)
    setInput('')
    if (toInject) useAgentStore.getState().setInitialChatMessage(null)
  }, [effectiveAgent?.id])

  const generateSmartResponse = (userQuery: string): string => {
    if (!currentAgent) return 'Erreur: Aucun agent connecté.'

    const tone = settings?.tone || 'Professional'
    let prefix = ''
    if (tone === 'Luxury') prefix = 'Monsieur, '
    else if (tone === 'Aggressive') prefix = 'Droit au but : '
    else if (tone === 'Friendly') prefix = 'Salut ! '
    else prefix = 'Bien reçu. '

    const context = settings?.industry
      ? `En tant qu'expert ${settings.industry} pour ${settings.name || 'votre société'}, `
      : "J'analyse votre demande. "

    const catalogEntry = MARKET_CATALOG.find((a) => a.id === currentAgent.id)
    const category = catalogEntry?.category
    const isLegal = category === 'ELITE' && currentAgent.role?.toLowerCase().includes('legal')
    const role = isLegal ? 'LEGAL' : (category || 'GENERAL')

    let coreMessage = ''
    if (role === 'LEGAL') coreMessage = 'je vérifie la conformité juridique et les risques associés.'
    else if (role === 'SALES') coreMessage = 'je prépare une approche commerciale pour maximiser le closing.'
    else if (role === 'MARKETING') coreMessage = "je cherche un angle viral pertinent pour votre audience."
    else if (role === 'TECH') coreMessage = "j'optimise le code pour garantir la stabilité."
    else coreMessage = "je traite cette opération immédiatement."

    const directive = currentAgent.customDirective?.trim()
      ? `\n\n[PROTOCOLE SPÉCIAL APPLIQUÉ : "${currentAgent.customDirective}"]`
      : ''

    return `${prefix}${context}${coreMessage}${directive}`
  }

  // Envoi d'un message (utilisé par le formulaire et les Quick Actions)
  const sendMessage = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || isLoading) return
    if (!effectiveAgent?.id || !effectiveAgent?.role) return

    if (effectiveAgent.id !== 'system') {
      useDashboardStore.getState().setActiveChatAgentId(effectiveAgent.id)
    }

    const userMessage = { role: 'user', content: trimmed }
    const historyWithUser = [...messages, userMessage]

    const { addMissionFromDb, completeMission, processUserRequest, addTransaction } = useDashboardStore.getState()
    const chatCostTask = 50
    const chatCostConversational = 5

    let missionId: string | null = currentMissionIdRef.current
    if (!missionId && user?.id) {
      const { data: insertRow, error: insertErr } = await supabase
        .from('missions')
        .insert({
          user_id: user.id,
          project_id: projectId || null,
          title: trimmed.slice(0, 500),
          status: 'in_progress',
          agent_id: effectiveAgent.id,
          agent_name: effectiveAgent?.name ?? 'Agent',
          cost: chatCostTask,
        })
        .select('id')
        .single()

      if (!insertErr && insertRow?.id) {
        missionId = insertRow.id as string
        currentMissionIdRef.current = missionId
        const agentName =
          effectiveAgent.id === 'system'
            ? 'SANTARAI SYSTEM'
            : MARKET_CATALOG.find((a) => a.id === effectiveAgent.id)?.name ?? effectiveAgent?.name ?? 'Agent'
        addMissionFromDb({
          id: missionId,
          projectId: projectId ?? undefined,
          agentId: effectiveAgent.id,
          agentName,
          title: trimmed.slice(0, 500),
          status: 'In Progress',
          date: new Date().toISOString(),
          cost: chatCostTask,
          isRead: false,
        })
      }
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      if (missionId) {
        const history = historyWithUser
          .slice(-20)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: typeof m.content === 'string' ? m.content : '' }))
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId,
            message: trimmed,
            agentId: effectiveAgent.id ?? 'ZEN',
            projectId: projectId ?? undefined,
            history,
          }),
        })
        const data = await res.json().catch(() => ({}))
        const content = data.content ?? data.reply ?? (res.ok ? '' : data.error ?? 'Erreur réseau.')
        setMessages(prev => [...prev, { role: 'assistant', content }])

        const deliveredViaTool = data.workAdded === true
        const longNonQuestion = (content?.length ?? 0) > 150 && !String(content).trim().endsWith('?')
        const shouldCloseMission = missionId && user?.id && (deliveredViaTool || longNonQuestion)

        const costForDebit = data.workAdded && typeof data.calculatedCost === 'number' ? data.calculatedCost : chatCostTask
        if (shouldCloseMission) {
          if (data.workAdded) {
            completeMission(
              missionId,
              data.resultSnippet != null ? String(data.resultSnippet) : undefined,
              typeof data.calculatedCost === 'number' ? data.calculatedCost : undefined
            )
          } else {
            const snippet = (content ?? '').slice(0, 2000)
            await supabase
              .from('missions')
              .update({
                result_snippet: snippet,
                cost: chatCostTask,
                status: 'completed',
              })
              .eq('id', missionId)
            completeMission(missionId, snippet.slice(0, 500))
          }
          currentMissionIdRef.current = null
        }

        addTransaction(costForDebit, 'DEBIT', `Mission (Entretien): ${effectiveAgent?.name ?? 'Salarié'}`)
        processUserRequest(effectiveAgent?.name ?? 'SANTARAI SYSTEM', trimmed)
        toast.success('Temps économisé !')
      } else {
        const basePrompt = effectiveAgent.systemPrompt || `Tu es ${effectiveAgent.name}, ${effectiveAgent.role}.`
        let smartSystemPrompt = basePrompt
        if (currentAgent || settings) {
          const toneHint = settings?.tone ? ` Ton à adopter: ${settings.tone}.` : ''
          const contextHint = settings?.industry || settings?.name
            ? ` Contexte: ${settings.name ?? 'Société'}${settings.industry ? `, secteur ${settings.industry}.` : '.'}`
            : ''
          const directiveHint = (currentAgent?.userDirectives ?? currentAgent?.customDirective)?.trim()
            ? `\n\nDirective prioritaire à respecter: ${currentAgent?.userDirectives ?? currentAgent?.customDirective}`
            : ''
          smartSystemPrompt = `${basePrompt}${contextHint}${toneHint}${directiveHint}`
        }
        const agentForApi = { ...effectiveAgent, systemPrompt: smartSystemPrompt }
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historyWithUser,
            agent: agentForApi,
          }),
        })
        if (!response.ok) throw new Error('Erreur réseau')
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = { role: 'assistant', content: '' }
        setMessages(prev => [...prev, assistantMessage])
        while (true) {
          const { done, value } = await reader!.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const textChunk = chunk.replace(/0:"/g, '').replace(/"/g, '')
          assistantMessage.content += textChunk
          setMessages(prev => {
            const newHistory = [...prev]
            newHistory[newHistory.length - 1] = { ...assistantMessage }
            return newHistory
          })
        }
        addTransaction(chatCostConversational, 'DEBIT', `Messagerie: ${effectiveAgent?.name ?? 'Salarié'}`)
        processUserRequest(effectiveAgent?.name ?? 'SANTARAI SYSTEM', trimmed)
        toast.success('Temps économisé !')
      }
    } catch (error) {
      console.error('Erreur envoi:', error)
      useDashboardStore.getState().addTransaction(chatCostConversational, 'DEBIT', `Messagerie (erreur fallback): ${effectiveAgent?.name ?? 'Salarié'}`)
      const aiResponseText = generateSmartResponse(trimmed)
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponseText }])
      }, 1500)
    } finally {
      setIsLoading(false)
      useDashboardStore.getState().setActiveChatAgentId(null)
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    await sendMessage(input)
  }

  const handleQuickAction = (action: string) => {
    sendMessage(`Lance une ${action}...`)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (effectiveAgent && input && input.trim()) {
        handleSend(e as any)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 400))
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 400))
        setPosition({ x: newX, y: newY })
      }
    }
    const handleMouseUp = () => setIsDragging(false)
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const theme = getAgentTheme(effectiveAgent.id || effectiveAgent)
  const personality = getAgentPersonality(effectiveAgent?.id)
  const isElite = isEliteAgent(effectiveAgent?.id)

  const handleClose = () => {
    setIsOpen(false)
    setChatOpen(false)
    onClose?.()
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl flex items-center justify-center transition-colors"
        aria-label="Ouvrir la Messagerie Interne"
      >
        <MessageSquare size={24} />
      </button>
    )
  }

  return (
    <div
      className={`
        fixed bottom-24 md:bottom-20 right-4 md:right-6 z-[9999] w-[400px] h-[600px] md:max-h-[80vh] overflow-hidden shadow-2xl border bg-[#0f172a]/95 backdrop-blur-xl animate-in zoom-in-95 duration-200 rounded-xl
        ${isElite ? 'border-yellow-500/60 ring-2 ring-yellow-500/20' : 'border border-white/10 ring-1 ring-white/5'}
      `}
      style={{
        boxShadow: isElite ? '0 20px 40px -10px rgba(234,179,8,0.25)' : `0 20px 40px -10px ${theme.hex}30`,
      }}
    >
      {/* HEADER - Draggable sur desktop uniquement */}
      <div 
        onMouseDown={isMobile ? undefined : handleMouseDown}
        className={`
          bg-gradient-to-r from-white/5 to-transparent flex justify-between items-center border-b border-white/5 select-none
          p-3 md:p-3 md:cursor-grab md:active:cursor-grabbing
          pt-4 pr-4
        `}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Avatar agent (style ELITE si applicable) */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
              isElite
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
            }`}
            title={isElite ? 'Agent ELITE' : effectiveAgent.name}
          >
            {effectiveAgent?.name?.charAt(0) || 'S'}
          </div>
          {effectiveAgent.id !== 'system' && onResetAgent != null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onResetAgent()
              }}
              className="flex-shrink-0 p-1.5 md:p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Revenir à SANTARAI SYSTEM"
            >
              <ArrowLeft size={18} className="md:w-4 md:h-4" />
            </button>
          )}
          <select
            value={effectiveAgent.id}
            onChange={(e) => {
              const id = e.target.value
              if (id === 'system') {
                setSelectedAgent(null)
              } else {
                const found = chatSelectableAgents.find((a) => a.id === id)
                if (found && found.id !== 'system') {
                  const fullAgent: MarketAgent =
                    MARKET_AGENTS.find((a) => a.id === found.id) ?? {
                      id: found.id,
                      name: found.name,
                      role: found.role,
                      category: '',
                      description: '',
                      price: 0,
                      tokens: 0,
                      systemPrompt: found.systemPrompt,
                    }
                  setSelectedAgent(fullAgent)
                }
              }
            }}
            className="flex-1 min-w-0 max-w-[180px] md:max-w-[220px] bg-slate-800/80 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {chatSelectableAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {effectiveAgent.id !== 'system' && onResetAgent != null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onResetAgent()
              }}
              className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-1 ml-1 shrink-0"
              title="Retour au Système Central"
            >
              Disconnect
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex-shrink-0 rounded transition-colors text-slate-400 hover:text-white hover:bg-white/10 p-3 md:p-1.5 touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
          aria-label="Fermer le chat"
        >
          <X size={24} className="md:w-4 md:h-4" />
        </button>
      </div>

      {/* MESSAGES AREA - flex-1 pour plein écran mobile */}
      <div className="p-4 flex flex-col flex-1 min-h-0 bg-[#020617]/50 md:h-96">
        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar px-1 min-h-0">
          {messages.map((m, index) => {
            const isUser = m.role === 'user'
            const isAssistant = m.role === 'assistant'
            return (
              <div key={index} className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isAssistant && (
                  <div className="flex flex-row items-start">
                    {/* AVATAR GHOST */}
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3 border border-indigo-500/30 flex-shrink-0">
                      <span className="text-indigo-400 font-bold text-xs">
                        {effectiveAgent?.name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    {/* BULLE ASSISTANT */}
                    <div className="bg-slate-800 border border-slate-700 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-md">
                      <div className="prose prose-invert prose-sm max-w-none text-gray-100">
                        <ReactMarkdown>
                          {m.content || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {isUser && (
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] shadow-lg">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {m.content || ''}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex w-full mb-6 justify-start">
              <div className="flex flex-row items-start">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border flex-shrink-0 animate-pulse ${
                    isElite
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                      : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  <span className="font-bold text-xs">
                    {effectiveAgent?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="bg-slate-800 border border-slate-700 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK ACTIONS (chips) — affichés pour les agents avec personnalité */}
        {effectiveAgent?.id !== 'system' && personality.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {personality.actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  border shrink-0
                  ${isElite
                    ? 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 hover:border-yellow-500/60'
                    : 'border-white/20 text-slate-300 bg-white/5 hover:bg-white/10 hover:border-white/30'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* INPUT AREA */}
        <form onSubmit={handleSend} className="relative mt-auto">
          <div className="relative flex items-center bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-lg focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              type="text"
              placeholder={`Transmettre un ordre à ${effectiveAgent.name}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-transparent pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-indigo-600/20"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
