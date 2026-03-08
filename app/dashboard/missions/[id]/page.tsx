"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { getMessages } from "@/lib/supabase/database"
import { ArrowLeft, Loader2, Send, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type SuggestedTask = { title: string; status?: string; type?: string }
type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content?: string
  taskSuggestions?: { tasks: SuggestedTask[] }
}

type Mission = {
  id: string
  title: string
  status: string
  agent_id: string | null
  agent_name: string | null
  project_id: string | null
  result_snippet: string | null
  created_at?: string
}

type Project = {
  id: string
  name: string
  description: string | null
}

const AGENTS: Record<
  string,
  { name: string; role: string; color: string; border: string }
> = {
  "MKT-G": { name: "GHOST", role: "Copywriter Stratège", color: "bg-slate-800", border: "border-slate-600" },
  "MKT-P": { name: "PIXEL", role: "Designer Visuel", color: "bg-purple-900/20", border: "border-purple-500/50" },
  "MKT-S": { name: "SUMO", role: "Growth Hacker", color: "bg-green-900/20", border: "border-green-500/50" },
  "MKT-R": { name: "RADAR", role: "Analyste Marché", color: "bg-blue-900/20", border: "border-blue-500/50" },
  ZEN: { name: "ZEN", role: "Assistant Général", color: "bg-gray-800", border: "border-gray-700" },
}

const AGENT_ID_ALIASES: Record<string, string> = {
  ghost: "MKT-G",
  pixel: "MKT-P",
  sumo: "MKT-S",
  radar: "MKT-R",
  zen: "ZEN",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  failed: "Échouée",
}

function getAgent(agentId: string | null) {
  const raw = (agentId ?? "ZEN").trim()
  const key = AGENT_ID_ALIASES[raw.toLowerCase()] ?? raw.toUpperCase()
  return AGENTS[key] ?? AGENTS.ZEN
}

const AGENT_BORDER_CLASS: Record<string, string> = {
  "MKT-G": "border-slate-500/60 shadow-slate-500/20",
  "MKT-P": "border-purple-500/60 shadow-purple-500/20",
  "MKT-S": "border-emerald-500/60 shadow-emerald-500/20",
  "MKT-R": "border-blue-500/60 shadow-blue-500/20",
  ZEN: "border-cyan-500/60 shadow-cyan-500/20",
}

function TaskProposalCard({
  tasks,
  missionId,
  projectId,
  agentId,
  onValidated,
}: {
  tasks: SuggestedTask[]
  missionId: string
  projectId: string | null
  agentId: string | null
  onValidated: () => void
}) {
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const key = (agentId ?? "ZEN").toString().toUpperCase()
  const borderClass = AGENT_BORDER_CLASS[key] ?? AGENT_BORDER_CLASS.ZEN

  const handleValidate = async () => {
    if (validating || validated || tasks.length === 0) return
    setValidating(true)
    setError(null)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map((t) => ({
            title: t.title,
            type: t.type,
            status: t.status ?? "todo",
          })),
          missionId,
          projectId: projectId ?? undefined,
          agentId: (agentId ?? "ZEN").toString().trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'ajout")
        return
      }
      setValidated(true)
      onValidated()
    } catch (e) {
      console.error(e)
      setError("Erreur réseau. Réessaie.")
    } finally {
      setValidating(false)
    }
  }

  if (validated) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 bg-emerald-950/40 px-4 py-3 shadow-lg",
          "border-emerald-500/50 flex items-center gap-3 text-emerald-400",
          "animate-in fade-in zoom-in-95 duration-300"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/30">
          <Check className="h-5 w-5" />
        </div>
        <span className="font-medium">Tâches ajoutées !</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 bg-slate-900/80 backdrop-blur-sm shadow-xl",
        borderClass,
        "overflow-hidden"
      )}
    >
      <div className="border-b border-slate-700/50 px-4 py-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tâches proposées par l&apos;agent
        </span>
      </div>
      <ul className="px-4 py-3 space-y-2">
        {tasks.map((t, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-200">
            <span className="text-slate-500">[ ]</span>
            {t.type && (
              <span className="rounded bg-slate-700/80 px-1.5 py-0.5 text-xs text-slate-400">{t.type}</span>
            )}
            <span>{t.title}</span>
          </li>
        ))}
      </ul>
      <div className="px-4 pb-4 pt-2">
        {error && (
          <p className="mb-2 text-sm text-red-400">{error}</p>
        )}
        <Button
          onClick={handleValidate}
          disabled={validating || validated}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold border-0 disabled:opacity-70"
        >
          {validating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "✅ Valider & Ajouter au Kanban"
          )}
        </Button>
      </div>
    </div>
  )
}

export default function MissionControlPage() {
  const params = useParams()
  const missionId = params.id as string

  const [mission, setMission] = useState<Mission | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      if (!missionId) {
        setLoading(false)
        return
      }
      try {
        const { data: missionData, error: missionErr } = await supabase
          .from("missions")
          .select("*")
          .eq("id", missionId)
          .single()

        if (missionErr || !missionData) {
          setMission(null)
          setLoading(false)
          return
        }

        setMission({
          id: missionData.id,
          title: missionData.title ?? "",
          status: missionData.status ?? "pending",
          agent_id: missionData.agent_id ?? null,
          agent_name: missionData.agent_name ?? null,
          project_id: missionData.project_id ?? null,
          result_snippet: missionData.result_snippet ?? null,
          created_at: missionData.created_at,
        })

        const projectId = missionData.project_id
        if (projectId) {
          const { data: projectData } = await supabase
            .from("projects")
            .select("id, name, description")
            .eq("id", projectId)
            .single()
          if (projectData) {
            setProject({
              id: projectData.id,
              name: projectData.name ?? "",
              description: projectData.description ?? null,
            })
          }
        }

        const agentId = missionData.agent_id ?? "ZEN"
        const { data: { user } } = await supabase.auth.getUser()
        const agentName =
          missionData.agent_name ||
          (AGENTS[agentId] ?? AGENTS[AGENT_ID_ALIASES[String(agentId).toLowerCase()]] ?? AGENTS.ZEN).name
        const objective = missionData.result_snippet || missionData.title
        const welcome: ChatMessage = {
          id: "welcome",
          role: "assistant",
          content: `Agent ${agentName} prêt. Objectif : ${objective}. En attente d'ordres.`,
        }
        if (user?.id && agentId) {
          const history = await getMessages(agentId, user.id)
          const mapped: ChatMessage[] = history.map((m) => ({
            id: m.id,
            role: m.role === "agent" ? "assistant" : "user",
            content: m.content,
          }))
          setMessages(mapped.length > 0 ? mapped : [welcome])
        } else {
          setMessages([welcome])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [missionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !mission || sending) return
    const agentId = mission.agent_id ?? "ZEN"
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setSending(true)
    try {
      const history = messages
        .filter((m) => m.role !== "assistant" || !m.id.startsWith("welcome"))
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content ?? "[Proposition de tâches]" }))
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          message: text,
          agentId: mission.agent_id || "ZEN",
          history,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "assistant", content: data.error || "Erreur lors de l'envoi." },
        ])
        return
      }
      if (data.type === "tool_use" && data.toolName === "suggest_tasks" && data.taskSuggestions?.tasks?.length) {
        const id = `a-${Date.now()}`
        const next: ChatMessage[] = []
        if (data.content) {
          next.push({ id: `${id}-text`, role: "assistant", content: data.content })
        }
        next.push({
          id,
          role: "assistant",
          taskSuggestions: { tasks: data.taskSuggestions.tasks },
        })
        setMessages((prev) => [...prev, ...next])
        return
      }
      const content = data.content ?? "Pas de réponse."
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content }])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Erreur réseau. Réessaie." },
      ])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-4 text-sm text-slate-400">Chargement de la mission...</p>
        </div>
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 bg-slate-950 p-6">
        <p className="text-slate-400">Mission introuvable.</p>
        <Button asChild variant="outline" className="border-slate-700 text-slate-300">
          <Link href="/dashboard/projects">Retour aux projets</Link>
        </Button>
      </div>
    )
  }

  const agent = getAgent(mission.agent_id)
  const agentDisplayName = mission.agent_name || agent.name
  const objective = mission.result_snippet || mission.title

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-slate-950">
      {/* Header de Mission — stylisé aux couleurs de l'agent */}
      <div
        className={cn(
          "shrink-0 border-b px-6 py-4 backdrop-blur-sm",
          agent.color,
          agent.border
        )}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={mission.project_id ? `/dashboard/projects/${mission.project_id}` : "/dashboard/projects"}
            className="text-slate-400 hover:text-cyan-400 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour au projet</span>
          </Link>
          <div className="h-5 w-px bg-slate-600" />
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-100">{mission.title}</h1>
            <span className={cn("rounded-md border px-2.5 py-0.5 text-xs font-medium text-slate-200", agent.border)}>
              {agent.role}
            </span>
            <span className="rounded-md border border-slate-600 bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-300">
              {STATUS_LABELS[mission.status] ?? mission.status}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-slate-200">
          Agent <span className="font-semibold text-white">{agentDisplayName}</span> assigné
        </p>
        {project && (
          <p className="mt-1 text-xs text-slate-500">
            Projet : <span className="text-slate-400">{project.name}</span>
          </p>
        )}
      </div>

      {/* Zone de chat */}
      <div className="flex flex-1 flex-col overflow-hidden p-4">
        <div className="mb-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-400">
          <span className="text-cyan-400/90">Objectif :</span> {objective}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-cyan-900/40 border border-cyan-700/40 px-4 py-2.5 text-sm text-slate-100">
                      {msg.content}
                    </div>
                  </div>
                )
              }
              return (
                <div key={msg.id} className="flex flex-col gap-2">
                  {msg.content != null && msg.content !== "" && (
                    <div className="flex justify-start gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white border",
                          agent.color,
                          agent.border
                        )}
                      >
                        {agentDisplayName.charAt(0)}
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-200">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.taskSuggestions && (
                    <div className="max-w-[420px]">
                      <TaskProposalCard
                        tasks={msg.taskSuggestions.tasks}
                        missionId={mission.id}
                        projectId={mission.project_id}
                        agentId={mission.agent_id}
                        onValidated={() => {}}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {sending && (
              <div className="flex justify-start gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white border",
                    agent.color,
                    agent.border
                  )}
                >
                  {agentDisplayName.charAt(0)}
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-700 bg-slate-800/80 px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Réflexion...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="mt-3 flex gap-2 shrink-0">
          <Textarea
            placeholder={`Discutez avec ${agentDisplayName}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={sending}
            className="min-h-[52px] resize-none border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-500/50"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}
