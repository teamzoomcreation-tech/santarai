'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Send, Bot, Sparkles, Rocket } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import { useAgentStore } from '@/stores/useAgentStore'

interface NeuralChatProps {
  activeAgent?: any | null
}

export default function NeuralChat({ activeAgent }: NeuralChatProps = {}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const assignTask = useAgentStore((state) => state.assignTask)

  // GESTION D'ÉTAT LOCALE : State local pour le texte (découplé de useChat)
  const [localInput, setLocalInput] = useState('')

  // AI SDK 6+ : transport avec DefaultChatTransport (api/body déplacés)
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ agent: activeAgent || null }),
    }),
    onError: (error) => {
      console.error('Erreur lors de la communication avec l\'IA:', error)
    },
  })
  const isLoading = status === 'submitted' || status === 'streaming'

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Réinitialiser les messages quand l'agent change (vider uniquement, pas de message de bienvenue)
  useEffect(() => {
    setMessages([])
  }, [activeAgent?.id, setMessages])

  // ENVOI DU MESSAGE : sendMessage (AI SDK 6+)
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Vérifications
    if (!localInput.trim()) return
    if (!activeAgent || !activeAgent.id || !activeAgent.role) return

    await sendMessage({ text: localInput })
    setLocalInput('')
  }

  const handleLaunchMission = async () => {
    if (!localInput || !localInput.trim()) return
    if (!activeAgent) {
      return
    }
    
    // assignTask(agentId, title, priority)
    await assignTask(activeAgent.id, localInput.trim(), 'medium')
    // Optionnel : vider l'input après avoir lancé la mission
    // setLocalInput('')
  }

  return (
    <div className="flex flex-col h-full bg-[#050a15]">
        {/* Header avec nom et rôle de l'agent */}
        {activeAgent && activeAgent.name && activeAgent.role && (
          <div className="p-3 border-b border-white/5 bg-[#020617]">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Entretien avec {activeAgent.name} - {activeAgent.role}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
            {messages.map((m) => {
              const isUser = m.role === 'user'
              const isAssistant = m.role === 'assistant'
              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isAssistant ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        {isAssistant ? <Bot size={16} className="text-white" /> : <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                        isAssistant ? 'bg-indigo-900/20 border border-indigo-500/20 text-indigo-100' : 'bg-slate-800 text-slate-200'
                    }`}>
                        {(m.parts ?? []).filter(isTextUIPart).map((p) => p.text).join('') || ''}
                    </div>
                </div>
              )
            })}
            {isLoading && (
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-600">
                        <Bot size={16} className="text-white animate-pulse" />
                    </div>
                    <div className="p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed bg-indigo-900/20 border border-indigo-500/20 text-indigo-100">
                        <span className="inline-flex gap-1">
                            <span className="animate-bounce">.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                        </span>
                    </div>
                </div>
            )}
        </div>

        {/* Input Zone */}
        <div className="p-4 border-t border-white/5 bg-[#020617]">
            <form onSubmit={handleSend} className="relative flex gap-2">
                <input 
                    type="text" 
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    placeholder={activeAgent && activeAgent.name ? `Posez une question à ${activeAgent.name}...` : "Sélectionnez un salarié pour commencer..."}
                    disabled={!activeAgent || isLoading}
                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:border-indigo-500 focus:bg-slate-900 transition-all outline-none text-white placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                    type="submit"
                    disabled={!activeAgent || isLoading || !localInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={14} />
                </button>
                {activeAgent && localInput && localInput.trim() && (
                    <button
                        type="button"
                        onClick={handleLaunchMission}
                        disabled={isLoading}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                        title="Lancer une Mission"
                    >
                        <Rocket size={14} />
                        <span className="hidden sm:inline">Mission</span>
                    </button>
                )}
            </form>
            <div className="flex justify-center mt-2">
                <span className="text-[10px] text-slate-600 flex items-center gap-1"><Sparkles size={8} /> Neural Link Active</span>
            </div>
        </div>
    </div>
  )
}
