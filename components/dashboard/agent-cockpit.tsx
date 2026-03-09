"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, Brain, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Agent } from "./my-agents-view"
import { useAuth } from "@/contexts/auth-context"
import { getMessages, saveMessage } from "@/lib/supabase/database"
import { AgentAvatar2D } from "@/components/AgentAvatar2D"
import { ChatMessage } from "./chat-message"

interface Message {
  id: string
  role: "user" | "agent"
  content: string
  timestamp: Date
}

interface AgentCockpitProps {
  agent: Agent
  onBack: () => void
  initialMessage?: string
}

export function AgentCockpit({ agent, onBack, initialMessage }: AgentCockpitProps) {
  const { user } = useAuth()
  const [systemPrompt, setSystemPrompt] = useState(
    `Tu es ${agent.name}, un ${agent.role} expert. Tu es chargé de créer du contenu de qualité, d'analyser les tendances du marché et de proposer des stratégies innovantes.`
  )
  const [creativity, setCreativity] = useState([70])
  const [model, setModel] = useState("gpt-4")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Charger les messages depuis Supabase au montage
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !agent.id) {
        setIsLoadingMessages(false)
        return
      }

      try {
        setIsLoadingMessages(true)
        const dbMessages = await getMessages(agent.id, user.id)
        
        // Convertir les messages de la DB au format local
        const formattedMessages: Message[] = dbMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
        
        setMessages(formattedMessages)
      } catch (error: any) {
        console.error("Erreur lors du chargement des messages:", error)
        toast.error("Erreur lors du chargement de la conversation")
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [user, agent.id])

  // Handle initial message (si pas de messages chargés)
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !isLoadingMessages && !isSending) {
      // Utiliser setTimeout pour éviter les appels multiples
      const timer = setTimeout(() => {
        handleSendMessage(initialMessage)
      }, 100)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isLoadingMessages])


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSave = () => {
    toast.success("Profil sauvegardé", {
      description: `Les paramètres de ${agent.name} ont été mis à jour`,
      duration: 2000,
    })
  }

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || inputValue.trim()
    if (!messageToSend || isSending || !user) return

    // Créer le message utilisateur
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    }

    // Afficher immédiatement le message de l'utilisateur
    setMessages((prev) => [...prev, userMessage])
    if (!messageText) {
      setInputValue("")
    }
    setIsSending(true)

    try {
      // Sauvegarder le message utilisateur dans Supabase
      const savedUserMessage = await saveMessage(user.id, agent.id, "user", messageToSend)
      if (savedUserMessage) {
        // Mettre à jour l'ID temporaire avec l'ID réel
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, id: savedUserMessage.id }
              : msg
          )
        )
      }

      // Construire l'historique de conversation pour l'API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Appeler l'API de chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          agentRole: agent.role,
          agentId: agent.id,
          conversationHistory: conversationHistory,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        // Afficher l'erreur précise d'OpenAI
        const errorMessage = data.error || "Erreur lors de l'appel à l'API"
        const errorType = data.errorType || "unknown"
        
        // Toast avec l'erreur précise
        toast.error("Erreur OpenAI", {
          description: errorMessage,
          duration: 5000,
        })
        
        throw new Error(errorMessage)
      }

      const aiResponse = data.response || "Désolé, je n'ai pas pu générer de réponse."

      // Créer le message de l'agent
      const agentMessage: Message = {
        id: `temp-${Date.now() + 1}`,
        role: "agent",
        content: aiResponse,
        timestamp: new Date(),
      }

      // Afficher la réponse de l'IA
      setMessages((prev) => [...prev, agentMessage])

      // Sauvegarder le message de l'agent dans Supabase
      const savedAgentMessage = await saveMessage(user.id, agent.id, "agent", aiResponse)
      if (savedAgentMessage) {
        // Mettre à jour l'ID temporaire avec l'ID réel
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMessage.id
              ? { ...msg, id: savedAgentMessage.id }
              : msg
          )
        )
      }
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error)
      
      // L'erreur précise a déjà été affichée dans le toast ci-dessus
      // Ne pas afficher de toast supplémentaire si c'est une erreur OpenAI
      if (!error?.message?.includes("Clé API") && !error?.message?.includes("Quota")) {
        toast.error("Erreur lors de l'envoi du message", {
          description: error?.message || "Une erreur est survenue",
          duration: 3000,
        })
      }
      
      // Retirer le message utilisateur en cas d'erreur
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {/* Header with Back Button */}
      <div className="border-b border-cyan-900/20 bg-gray-950/50 px-6 py-4 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
          <div className="h-6 w-px bg-cyan-900/20" />
          <h2 className="text-xl font-semibold text-foreground">Cockpit Agent</h2>
        </div>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Column - Settings (30%) */}
        <div className="w-[30%] bg-gray-950/30 overflow-y-auto custom-scrollbar border-r border-cyan-900/10">
          <div className="p-6 space-y-6">
            {/* Agent Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-cyan-900/10">
              <AgentAvatar2D 
                name={agent.name} 
                size="xl"
              />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.role}</p>
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt" className="text-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-cyan-400" />
                Directives Principales
              </Label>
              <div className="rounded-lg border border-cyan-900/20 bg-gray-900/30 p-3">
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="bg-transparent border-0 text-foreground min-h-[150px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  placeholder="Définissez l'identité et le rôle de l'agent..."
                />
              </div>
            </div>

            {/* Creativity Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Créativité (Température)</Label>
                <span className="text-sm font-semibold text-cyan-400">{creativity[0]}%</span>
              </div>
              <Slider
                value={creativity}
                onValueChange={setCreativity}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-cyan-500"
              />
              <p className="text-xs text-muted-foreground">
                Contrôle le niveau de créativité et d'originalité des réponses
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-foreground">
                Modèle IA
              </Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger
                  id="model"
                  className="bg-gray-900/50 border-cyan-900/30 text-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-cyan-900/30">
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3.5">Claude 3.5</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
            >
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder le profil
            </Button>
          </div>
        </div>

        {/* Right Column - Chat Interface (70%) */}
        <div className="flex flex-1 flex-col bg-gray-950/50 min-w-0">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
            {isLoadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 mx-auto">
                    <AgentAvatar2D 
                      name={agent.name} 
                      size="xl"
                    />
                  </div>
                  <p className="text-muted-foreground mb-1">Chargement de la conversation...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 mx-auto">
                    <AgentAvatar2D 
                      name={agent.name} 
                      size="xl"
                    />
                  </div>
                  <p className="text-muted-foreground mb-1">Aucune conversation</p>
                  <p className="text-sm text-muted-foreground/60">
                    Envoyez une instruction à {agent.name} pour commencer
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "agent" && (
                      <AgentAvatar2D 
                        name={agent.name} 
                        size="md"
                      />
                    )}
                    <ChatMessage
                      content={message.content}
                      role={message.role}
                    />
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-foreground">VO</span>
                      </div>
                    )}
                  </div>
                ))}
                {isSending && (
                  <div className="flex gap-3 justify-start">
                    <AgentAvatar2D 
                      name={agent.name} 
                      size="md"
                    />
                    <div className="bg-gray-900/50 text-foreground border border-cyan-900/30 rounded-lg px-4 py-2">
                      <p className="text-sm text-muted-foreground">L'agent écrit...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="border-t border-cyan-900/20 bg-gray-950/30 p-4 shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Envoyer une instruction à ${agent.name}...`}
                className="bg-gray-900/50 border-cyan-900/30 text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:ring-cyan-500/20 resize-none min-h-[60px] max-h-[120px]"
                rows={2}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isSending}
                className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)] h-[60px] px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
