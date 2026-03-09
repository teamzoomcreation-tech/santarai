"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { Input } from "@/components/ui/input"
import { Calendar, Trash2, Pencil, FileText, Loader2, Copy, Check, RefreshCw, Download, Printer, ChevronDown, Link2, Zap, FileSpreadsheet, FileCode, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDashboardStore } from "@/lib/store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "sonner"
import { AgentAvatar2D } from "@/components/AgentAvatar2D"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"
import { canExportCsv } from "@/lib/agentDirectives"

export interface TaskCardTask {
  id: string
  title: string
  description: string
  image_url?: string
  output_content?: string | null
  output_type?: "text" | "code" | null
  dueDate: string
  tag: string
  tagColor: string
  agent_id?: string | null
  assignedAgents: Array<{ id: string; name: string; avatar: string; color: string }>
}

interface TaskCardProps {
  task: TaskCardTask
  columnId: "todo" | "inprogress" | "done"
  availableAgents: Array<{ id: string; name: string; role?: string; avatar_color?: string }>
  tagColorConfig: Record<string, string>
  onStatusChange: (taskId: string, currentStatus: string, newStatus: "todo" | "inprogress" | "done") => void
  onDelete: (taskId: string) => void
  onReload: () => void
  onTaskClick?: (task: TaskCardTask) => void
}

export function TaskCard({
  task,
  columnId,
  availableAgents,
  tagColorConfig,
  onStatusChange,
  onDelete,
  onReload,
  onTaskClick,
}: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)
  const [isExecuteRunning, setIsExecuteRunning] = useState(false)
  const [executeError, setExecuteError] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("santarai_webhook_url") ?? "" : ""
  )
  const [isSendingWebhook, setIsSendingWebhook] = useState(false)
  const [copied, setCopied] = useState(false)
  const [livrableApproved, setLivrableApproved] = useState(false)
  const [showReadingMode, setShowReadingMode] = useState(false)
  const hasExecutedRef = useRef(false)
  const resultModalContentRef = useRef<HTMLDivElement>(null)

  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const missions = useDashboardStore((s) => s.missions)
  const instruction = (task.description || task.title || "").trim()
  const agent = availableAgents.find((a) => a.id === task.agent_id)
  const agentRole = agent?.role ?? "Assistant"
  const missionMatch = missions.find((m) => m.title?.toLowerCase().includes(task.title?.toLowerCase().slice(0, 30)))
  const reportCost = missionMatch?.cost ?? null

  useEffect(() => {
    setEditDescription(task.description)
  }, [task.description])

  useEffect(() => {
    setEditTitle(task.title)
  }, [task.title])

  const runExecute = useCallback(async () => {
    setIsExecuteRunning(true)
    setExecuteError(false)
    hasExecutedRef.current = true

    try {
      const res = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taskId: task.id,
          instruction: instruction || task.title,
          agentRole,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        hasExecutedRef.current = false
        setExecuteError(true)
        if (res.status !== 401) {
          toast.error(data.error ?? "Erreur lors de la génération")
        }
        return
      }
      toast.success("Production terminée !")
      onReload()
    } catch (err: any) {
      hasExecutedRef.current = false
      setExecuteError(true)
      toast.error("Erreur lors de la génération", { description: err?.message })
    } finally {
      setIsExecuteRunning(false)
    }
  }, [task.id, instruction, task.title, agentRole, onReload])

  // Factory Mode : Si "En cours" OU "Terminé" mais vide → lancer la génération IA
  useEffect(() => {
    const shouldGenerate =
      (columnId === "inprogress" || columnId === "done") &&
      !task.output_content &&
      !isExecuteRunning &&
      !hasExecutedRef.current
    if (!shouldGenerate) return
    runExecute()
  }, [columnId, task.id, task.output_content, isExecuteRunning, runExecute])

  const handleSaveDescription = async () => {
    try {
      const res = await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, content: editDescription }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success("Consigne mise à jour")
      setIsEditing(false)
      onReload()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleSaveTitle = async () => {
    const trimmed = editTitle.trim()
    if (!trimmed) {
      toast.error("Le titre ne peut pas être vide")
      return
    }
    try {
      const res = await fetch("/api/tasks/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, title: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error ?? "Erreur lors de la mise à jour du titre")
        return
      }
      toast.success("Titre enregistré")
      setIsEditingTitle(false)
      onReload()
    } catch {
      toast.error("Erreur lors de la mise à jour du titre")
    }
  }

  const outputContent = (task.output_content ?? task.description ?? "").trim()

  /** Nom de fichier : [DATE]-[SALARIÉ]-[NOM_MISSION]. */
  const getExportBasename = () => {
    const d = task.dueDate ? new Date(task.dueDate) : new Date()
    const dateStr = d.toISOString().slice(0, 10)
    const salarie = (agent?.name ?? "Salarie").replace(/[^a-zA-Z0-9\u00C0-\u024F\-_]/g, "_").slice(0, 40)
    const title = (task.title ?? "Mission").replace(/[^a-zA-Z0-9\u00C0-\u024F\-_\s]/g, "").replace(/\s+/g, "_").slice(0, 60)
    return `${dateStr}-${salarie}-${title}`
  }

  const textToCsv = (text: string) => {
    const lines = text.trim().split(/\r?\n/)
    const tableRows: string[][] = []
    for (const line of lines) {
      if (line.includes("|") && !line.startsWith("|---")) {
        const cells = line.split("|").map((c) => c.trim()).filter(Boolean)
        if (cells.length > 1) tableRows.push(cells)
      } else if (line.includes("\t")) {
        tableRows.push(line.split("\t").map((c) => `"${c.replace(/"/g, '""')}"`))
      }
    }
    if (tableRows.length === 0) return lines.map((l) => `"${l.replace(/"/g, '""')}"`).join("\r\n")
    return tableRows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n")
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    const dateFormatted = (task.dueDate ? new Date(task.dueDate) : new Date()).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    const html = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Rapport - ${task.title}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 2rem 3rem; max-width: 800px; margin: 0 auto; color: #1e293b; }
        .logo { font-size: 1.5rem; font-weight: 800; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 0.5rem; }
        .logo span { color: #06b6d4; }
        h1 { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; margin-top: 2rem; margin-bottom: 0.5rem; }
        .meta { font-size: 0.9rem; color: #475569; margin-bottom: 1.5rem; }
        .content { white-space: pre-wrap; font-size: 0.875rem; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
      </style></head>
      <body>
        <div class="logo">Santar<span>AI</span></div>
        <p class="meta">Rapport de livrable</p>
        <h1>Salarié</h1>
        <p class="meta">${(agent?.name ?? "Salarié").replace(/</g, "&lt;")}</p>
        <h1>Mission</h1>
        <p class="meta">${(task.title ?? "").replace(/</g, "&lt;")}</p>
        <h1>Date</h1>
        <p class="meta">${dateFormatted}</p>
        <h1>Synthèse exécutive</h1>
        <div class="content">${(outputContent || "").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</div>
      </body></html>
    `
    const win = window.open("", "_blank")
    if (!win) {
      toast.error("Autorisez les pop-ups pour exporter en PDF")
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
    toast.success(t.dashboard.missions.printSavePdf)
  }

  const handleExportCsv = () => {
    const csv = textToCsv(outputContent)
    downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `${getExportBasename()}.csv`)
    toast.success(t.dashboard.missions.exportCsvDownloaded)
  }

  const handleExportJson = () => {
    const payload = {
      salarie: agent?.name ?? t.dashboard.missions.agent ?? "Salarié",
      mission: task.title ?? "",
      date: task.dueDate ?? new Date().toISOString(),
      cost_tk: reportCost ?? null,
      result: outputContent,
    }
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `${getExportBasename()}.json`)
    toast.success(t.dashboard.missions.exportJsonDownloaded)
  }

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(outputContent)
    setCopied(true)
    toast.success(t.dashboard.missions.copied)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMd = () => {
    const md = `# ${task.title ?? t.dashboard.missions.missionLabel}\n\n**${t.dashboard.contract.salarieLabel}:** ${agent?.name ?? t.dashboard.missions.agent ?? "Salarié"}\n**Date:** ${(task.dueDate ? new Date(task.dueDate) : new Date()).toLocaleString("fr-FR")}\n${reportCost != null ? `**${t.dashboard.missions.costLabelShort}:** ${reportCost} TK\n` : ""}\n---\n\n${outputContent}`
    downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `${getExportBasename()}.md`)
    toast.success(t.dashboard.missions.exportMdDownloaded)
  }

  const handlePrintPdf = () => {
    if (!resultModalContentRef.current) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error(t.dashboard.missions.allowPopupsToPrint)
      return
    }
    const content = resultModalContentRef.current.innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${task.title}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; color: #1e293b; }
            h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
            h2 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; }
            p, li { margin: 0.5rem 0; line-height: 1.6; }
            ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
            pre, code { background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
            pre { padding: 1rem; overflow-x: auto; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
    toast.success(t.dashboard.missions.printWindowOpened)
  }

  const handleOpenWebhookModal = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("santarai_webhook_url") ?? "" : ""
    if (saved) setWebhookUrl(saved)
    setShowWebhookModal(true)
  }

  const handleSendWebhook = async () => {
    const url = webhookUrl.trim()
    if (!url) {
      toast.error("Collez l'URL de votre Webhook")
      return
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("L'URL doit commencer par http:// ou https://")
      return
    }
    const payload = {
      projectName: task.tag || "Projet SantarAI",
      taskName: task.title,
      agentName: agent?.name ?? "Salarié",
      content: task.output_content ?? "",
      timestamp: new Date().toISOString(),
    }
    setIsSendingWebhook(true)
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: url, payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? res.statusText ?? "Erreur d'envoi")
      if (typeof window !== "undefined") localStorage.setItem("santarai_webhook_url", url)
      toast.success(t.dashboard.missions.pushSuccess)
      setShowWebhookModal(false)
    } catch (err) {
      toast.error("Erreur d'envoi", {
        description: err instanceof Error ? err.message : "Vérifiez l'URL et réessayez.",
      })
    } finally {
      setIsSendingWebhook(false)
    }
  }

  const handleStatusChange = (newStatus: "todo" | "inprogress" | "done") => {
    if (newStatus === "inprogress" && !task.agent_id) {
      toast.error("Assignez un agent d'abord")
      return
    }
    onStatusChange(task.id, columnId, newStatus)
  }

  const isInProgress = columnId === "inprogress"
  const isDone = columnId === "done"
  const isGenerating = isExecuteRunning && !executeError
  const showLoading = (isInProgress || isDone) && isGenerating

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isEditing && !isEditingTitle && onTaskClick?.(task)}
        onKeyDown={(e) => e.key === "Enter" && !isEditing && !isEditingTitle && onTaskClick?.(task)}
        className={cn(
          "group relative rounded-lg border bg-gray-900/30 p-4 transition-all cursor-pointer",
          isInProgress && "border-cyan-500/50 animate-kanban-pulse",
          !isInProgress && "border-cyan-900/20",
          showLoading && "opacity-90",
          !showLoading && !isInProgress && "hover:border-cyan-500/30 hover:bg-gray-900/40"
        )}
      >
        {/* Badge LIVRABLE VALIDÉ (colonne Terminé) */}
        {isDone && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border-2 border-amber-400/80 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)]">
              LIVRABLE VALIDÉ
            </span>
          </motion.div>
        )}

        {/* Bouton Supprimer */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full shadow-md hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete(task.id)
            }}
            aria-label="Supprimer la tâche"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Tag */}
        <div className="mb-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
              tagColorConfig[task.tagColor] || tagColorConfig.cyan
            )}
          >
            {task.tag}
          </span>
        </div>

        {/* Titre : édition en todo */}
        {columnId === "todo" && isEditingTitle ? (
          <div className="mb-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titre de la tâche"
              className="bg-gray-900/50 border-cyan-900/30 text-foreground text-sm font-semibold"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveTitle} className="text-xs">
                Sauvegarder
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)} className="text-xs">
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground flex-1">{task.title}</h4>
            {columnId === "todo" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-cyan-400"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingTitle(true)
                }}
                aria-label="Modifier le titre"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* État TODO : Édition de la consigne */}
        {columnId === "todo" && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Consigne pour l'IA (prompt)..."
                  className="bg-gray-900/50 border-cyan-900/30 text-foreground text-sm min-h-[80px]"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDescription} className="text-xs">
                    Enregistrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-xs">
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                {task.description ? (
                  <div className="flex-1 text-sm text-muted-foreground line-clamp-2 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{task.description}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="flex-1 text-sm text-muted-foreground italic">Aucune consigne pour l&apos;instant</p>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-cyan-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                  aria-label="Modifier la consigne"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* État EN COURS : Loading / Production / Erreur + Retry */}
        {isInProgress && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            {executeError ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runExecute()}
                disabled={isExecuteRunning}
                className="w-full justify-center gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <RefreshCw className={cn("h-4 w-4", isExecuteRunning && "animate-spin")} />
                {isExecuteRunning ? "Regénération..." : "Réessayer la génération"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Production en cours...</span>
              </div>
            )}
          </div>
        )}

        {/* État TERMINÉ : Loader si génération, sinon Voir résultat ou Retry */}
        {isDone && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            {isGenerating ? (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Production en cours...</span>
              </div>
            ) : executeError ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runExecute()}
                disabled={isExecuteRunning}
                className="w-full justify-center gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <RefreshCw className={cn("h-4 w-4", isExecuteRunning && "animate-spin")} />
                {isExecuteRunning ? "Regénération..." : "Réessayer la génération"}
              </Button>
            ) : (task.output_content || task.description) ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => setShowResultModal(true)}
              >
                <FileText className="h-4 w-4" />
                VOIR LE RÉSULTAT
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground italic">Résultat en attente</p>
            )}
          </div>
        )}

        {/* Description pour todo (non edit mode) et inprogress/done (affichage simple) */}
        {columnId !== "todo" && !isEditing && task.description && !showLoading && (
          <div className="text-sm text-muted-foreground mb-3 line-clamp-2 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{task.description}</ReactMarkdown>
          </div>
        )}

        {!task.description && columnId !== "todo" && !showLoading && (
          <p className="text-sm text-muted-foreground mb-3 italic">Aucun contenu pour l&apos;instant</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{task.dueDate}</span>
          </div>
        </div>

        {/* Status Selector */}
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <Select
            value={columnId}
            onValueChange={(value) => {
              if (value !== columnId) handleStatusChange(value as "todo" | "inprogress" | "done")
            }}
            disabled={showLoading}
          >
            <SelectTrigger className="bg-gray-900/50 border-cyan-900/30 text-foreground text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-cyan-900/30">
              <SelectItem value="todo">À faire</SelectItem>
              <SelectItem value="inprogress">En cours</SelectItem>
              <SelectItem value="done">Terminé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Salarié : affichage statique (read-only) */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          {task.agent_id ? (
            <div className="flex items-center gap-2">
              <AgentAvatar2D name={agent?.name ?? "Salarié"} size="sm" />
              <span className="truncate text-muted-foreground">{agent?.name ?? "Salarié"}</span>
            </div>
          ) : (
            <span className="text-muted-foreground italic">Non assigné</span>
          )}
        </div>
      </div>

      {/* Modal Résultat — Rapport de Livrable (Bilan de Fin de Mission) */}
      <Dialog open={showResultModal} onOpenChange={(open) => { setShowResultModal(open); if (!open) setLivrableApproved(false) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-[#f8f6f3] dark:bg-gray-900/95 border-2 border-gray-300 dark:border-gray-700 shadow-2xl">
          {/* Zone scrollable : contenu complet du rapport (Synthèse exécutive non tronquée) */}
          <DialogTitle className="sr-only">{t.dashboard.taskDetail.operationSheetTitleSr}</DialogTitle>
          <DialogDescription className="sr-only">
            {t.dashboard.taskDetail.operationSheetDescriptionSr}
          </DialogDescription>
          <AnimatePresence>
            {livrableApproved && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 8 }}
                exit={{ scale: 1.05, opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <span className="px-10 py-5 rounded-lg border-4 border-emerald-600 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-2xl tracking-widest shadow-lg">
                  VALIDÉ
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {/* En-tête — Rapport de Livrable */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shrink-0">
            <span className="text-[10px] font-black tracking-[0.25em] text-gray-700 dark:text-slate-300 uppercase">
              {t.dashboard.missions.reportTitle} — {(agent?.name ?? t.dashboard.missions.agent ?? "Salarié").toUpperCase()}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
            {task.image_url && (
              <section>
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500 mb-1.5">Rendu visuel</h4>
                <div className="rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 shadow-lg aspect-video bg-gray-100 dark:bg-gray-900">
                  <img src={task.image_url} alt="Rendu visuel" className="w-full h-full object-cover" />
                </div>
              </section>
            )}
            {/* SYNTHÈSE EXÉCUTIVE — pas de max-height ni line-clamp : rapport complet lisible */}
            <section className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500">{t.dashboard.missions.synthesisExecutive}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-gray-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400"
                  onClick={() => setShowReadingMode(true)}
                  aria-label={t.dashboard.missions.readingModeExpand}
                  title={t.dashboard.missions.readingModeExpand}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div
                ref={resultModalContentRef}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 p-4 shadow-inner text-gray-800 dark:text-slate-200 font-mono text-sm leading-relaxed min-h-[120px]"
              >
                <div className="prose prose-sm max-w-none prose-headings:text-cyan-700 dark:prose-headings:text-cyan-400 prose-p:text-gray-800 dark:prose-p:text-slate-200 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-300 dark:prose-pre:border-gray-600 prose-pre:rounded-lg prose-pre:p-4 prose-code:bg-gray-200 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-cyan-700 dark:prose-code:text-cyan-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {outputContent}
                  </ReactMarkdown>
                </div>
              </div>
            </section>
            {/* ANALYSE DE PERFORMANCE */}
            <section>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500 mb-1.5">{t.dashboard.missions.performanceAnalysis}</h4>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                Coût en Tokens : <span className="font-mono font-semibold">{reportCost != null ? `${reportCost} TK` : "— TK"}</span>
                <span className="ml-2 text-xs text-gray-500 dark:text-slate-500">
                  · Temps de production : livrable généré à la demande
                </span>
              </p>
            </section>
            {/* Objet */}
            <section>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500 mb-1.5">{t.dashboard.missions.objectLabel}</h4>
              <p className="text-sm font-semibold text-gray-900 dark:text-white border-l-4 border-cyan-600 dark:border-cyan-500 pl-3 py-1">
                {task.title}
              </p>
            </section>
            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowResultModal(false)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs px-5 py-2.5 shadow-lg"
              >
                {t.dashboard.missions.archiveToRegister}
              </Button>
              <Button
                onClick={() => {
                  setLivrableApproved(true)
                  confetti({ particleCount: 60, spread: 55, origin: { x: 0.5, y: 0.6 }, colors: ["#10B981", "#34D399", "#FBBF24"] })
                  setTimeout(() => setLivrableApproved(false), 2000)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs px-5 py-2.5 shadow-lg"
              >
                {t.dashboard.missions.approveDeliverable}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs">
                    <Download className="h-4 w-4" />
                    {t.dashboard.missions.exportLabel}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 w-56">
                  <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    PDF (rapport officiel)
                  </DropdownMenuItem>
                  {canExportCsv(agent?.id ?? agent?.name) && (
                    <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDownloadMd} className="cursor-pointer">
                    <FileCode className="h-4 w-4 mr-2" />
                    Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJson} className="cursor-pointer">
                    <FileCode className="h-4 w-4 mr-2" />
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyOutput} className="cursor-pointer">
                    {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                    Copier le texte
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrintPdf} className="cursor-pointer">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer / Sauvegarder en PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="opacity-60 cursor-not-allowed">
                    <Link2 className="h-4 w-4 mr-2" />
                    Envoyer vers Notion
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">Bientôt</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenWebhookModal} className="cursor-pointer">
                    <Zap className="h-4 w-4 mr-2" />
                    Envoyer via Webhook (Zapier/Make)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mode lecture plein écran — Boardroom Reading Mode */}
      <AnimatePresence>
        {showReadingMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] flex flex-col h-screen bg-[#f5f2ed] dark:bg-[#0c0c0f]"
            aria-modal="true"
            role="dialog"
            aria-label={t.dashboard.missions.readingModeTitle}
          >
            <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-300/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/60 shrink-0">
              <span className="text-xs font-semibold tracking-widest uppercase text-gray-600 dark:text-slate-400">
                {t.dashboard.missions.readingModeTitle}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setShowReadingMode(false)}
                aria-label={t.dashboard.missions.readingModeBack}
              >
                <Minimize2 className="h-4 w-4" />
                {t.dashboard.missions.readingModeBack}
              </Button>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 min-h-0 overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto py-12 px-8 sm:px-12">
                <div className="prose prose-lg max-w-none leading-relaxed text-gray-800 dark:text-slate-200 prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-semibold prose-p:text-gray-800 dark:prose-p:text-slate-200 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-code:bg-gray-100 dark:prose-code:bg-gray-800/80">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {outputContent}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Webhook Zapier / Make */}
      <Dialog open={showWebhookModal} onOpenChange={setShowWebhookModal}>
        <DialogContent className="bg-gray-950 border-cyan-900/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t.dashboard.connector.dialogTitle}</DialogTitle>
            <DialogDescription className="sr-only">
              {t.dashboard.connector.dialogDescriptionSr}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Collez l'URL de votre Webhook pour envoyer ce livrable vers vos outils (Notion, Slack, Drive...).
          </p>
          <Input
            placeholder="https://hooks.zapier.com/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="bg-gray-900/50 border-cyan-900/30 font-mono text-sm"
          />
          <Button
            onClick={handleSendWebhook}
            disabled={isSendingWebhook}
            className="w-full bg-cyan-600 hover:bg-cyan-500"
          >
            {isSendingWebhook ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
