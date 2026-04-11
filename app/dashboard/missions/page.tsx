'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase/client'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'
import {
  FolderOpen,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Eye,
  Target,
  TrendingUp,
  DollarSign,
  Trash2,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileCode,
  Share2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useDashboardStore, type Mission } from '@/lib/store'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Nom de fichier : [DATE]-[SALARIÉ]-[NOM_MISSION] (caractères sûrs). */
function getExportBasename(mission: Mission): string {
  const d = new Date(mission.date)
  const dateStr = d.toISOString().slice(0, 10)
  const salarie = (mission.agentName ?? 'Salarie').replace(/[^a-zA-Z0-9\u00C0-\u024F\-_]/g, '_').slice(0, 40)
  const title = (mission.title ?? 'Mission').replace(/[^a-zA-Z0-9\u00C0-\u024F\-_\s]/g, '').replace(/\s+/g, '_').slice(0, 60)
  return `${dateStr}-${salarie}-${title}`
}

/** Détecte tableaux Markdown (lignes avec |) ou TSV et retourne CSV. */
function textToCsv(text: string): string {
  const lines = text.trim().split(/\r?\n/)
  const tableRows: string[][] = []
  for (const line of lines) {
    if (line.includes('|') && !line.startsWith('|---')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
      if (cells.length > 1) tableRows.push(cells)
    } else if (line.includes('\t')) {
      tableRows.push(line.split('\t').map((c) => `"${c.replace(/"/g, '""')}"`))
    }
  }
  if (tableRows.length === 0) {
    return lines.map((l) => `"${l.replace(/"/g, '""')}"`).join('\r\n')
  }
  return tableRows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const LOCALE_MAP: Record<string, string> = { fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE', ar: 'ar-SA' }

function mapDbStatus(status: string | null): Mission['status'] {
  switch (status) {
    case 'completed': return 'Completed'
    case 'failed': return 'Failed'
    case 'in_progress': return 'In Progress'
    default: return 'Pending'
  }
}

function formatMissionDate(iso: string, locale = 'fr-FR'): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function MissionsPage() {
  const router = useRouter()
  const { currentLang } = useLanguage()
  const { user } = useAuth()
  const t = translations[currentLang] ?? translations.fr
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [viewingReport, setViewingReport] = useState<Mission | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [livrableApproved, setLivrableApproved] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('santarai_webhook_url') ?? '' : ''
  )
  const [isSendingWebhook, setIsSendingWebhook] = useState(false)

  const fetchMissions = useCallback(async () => {
    if (!user?.id) {
      setMissions([])
      setLoading(false)
      return
    }
    setLoading(true)
    // Archives des Opérations : uniquement les missions (interactions 1-to-1), jamais les tâches projet
    const { data, error } = await supabase
      .from('missions')
      .select('id, title, status, agent_id, agent_name, cost, result_snippet, created_at, is_read, project_id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .is('project_id', null)
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Erreur chargement missions:', JSON.stringify(error, null, 2))
      setMissions([])
      return
    }
    const raw = (data ?? []) as Record<string, unknown>[]
    const list: Mission[] = raw.map((row) => ({
      id: String(row.id ?? ''),
      projectId: row.project_id != null ? String(row.project_id) : undefined,
      agentId: String(row.agent_id ?? ''),
      agentName: String(row.agent_name ?? ''),
      title: String(row.title ?? ''),
      status: mapDbStatus((row.status as string) ?? null),
      date: String(row.created_at ?? ''),
      cost: Number(row.cost ?? 0),
      resultSnippet: row.result_snippet != null ? String(row.result_snippet) : undefined,
      isRead: row.is_read === true,
    }))
    setMissions(list)
    const unread = list.filter((m) => !m.isRead).length
    useDashboardStore.getState().setMissionsUnreadCount(unread)
  }, [user?.id])

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  const totalMissions = missions.length
  const successRate =
    totalMissions > 0
      ? Math.round(
          (missions.filter((m) => m.status === 'Completed').length / totalMissions) * 100
        )
      : 0
  const totalCost = missions.reduce((sum, m) => sum + m.cost, 0)

  const filteredMissions = useMemo(() => {
    if (!filter.trim()) return missions
    const q = filter.trim().toLowerCase()
    return missions.filter(
      (m) =>
        m.agentName.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)
    )
  }, [missions, filter])

  const handleExportCSV = () => {
    alert(t.dashboard.missions.exportInProgress)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleExportPdf = (mission: Mission) => {
    const dateFormatted = new Date(mission.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    const html = `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Rapport - ${mission.title}</title>
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
        <p class="meta">${(mission.agentName ?? 'Salarié').replace(/</g, '&lt;')}</p>
        <h1>Mission</h1>
        <p class="meta">${(mission.title ?? '').replace(/</g, '&lt;')}</p>
        <h1>Date</h1>
        <p class="meta">${dateFormatted}</p>
        <h1>Synthèse exécutive</h1>
        <div class="content">${(mission.resultSnippet ?? '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>
      </body></html>
    `
    const win = window.open('', '_blank')
    if (!win) {
      toast.error('Autorisez les pop-ups pour exporter en PDF')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const handleExportCsv = (mission: Mission) => {
    const text = mission.resultSnippet ?? ''
    const csv = textToCsv(text)
    const base = getExportBasename(mission)
    downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), `${base}.csv`)
    toast.success(t.dashboard.missions.exportInProgress)
  }

  const handleExportMd = (mission: Mission) => {
    const md = `# ${mission.title ?? 'Mission'}\n\n**Salarié:** ${mission.agentName ?? 'Salarié'}\n**Date:** ${new Date(mission.date).toLocaleString('fr-FR')}\n**Coût:** ${mission.cost} TK\n\n---\n\n${mission.resultSnippet ?? ''}`
    const base = getExportBasename(mission)
    downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${base}.md`)
    toast.success('Export Markdown téléchargé')
  }

  const handleExportJson = (mission: Mission) => {
    const payload = {
      salarie: mission.agentName ?? 'Salarié',
      mission: mission.title ?? '',
      date: mission.date,
      cost_tk: mission.cost,
      result: mission.resultSnippet ?? '',
    }
    const base = getExportBasename(mission)
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${base}.json`)
    toast.success('Export JSON téléchargé')
  }

  const handlePushToExternal = async (mission: Mission) => {
    const url = webhookUrl.trim()
    if (!url) {
      toast.error('Collez l’URL de destination (Webhook / Zapier / Make)')
      return
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('L’URL doit commencer par http:// ou https://')
      return
    }
    setIsSendingWebhook(true)
    try {
      const payload = {
        projectName: null,
        mission: mission.title ?? '',
        agentName: mission.agentName ?? 'Salarié',
        content: mission.resultSnippet ?? '',
        cost_tk: mission.cost,
        timestamp: new Date().toISOString(),
      }
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url, payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? res.statusText ?? 'Erreur d’envoi')
      if (typeof window !== 'undefined') localStorage.setItem('santarai_webhook_url', url)
      toast.success(t.dashboard.missions.pushSuccess)
    } catch (err) {
      toast.error('Erreur de propulsion', {
        description: err instanceof Error ? err.message : 'Vérifiez l’URL et réessayez.',
      })
    } finally {
      setIsSendingWebhook(false)
    }
  }

  const markMissionAsRead = useCallback(async (id: string) => {
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)))
    useDashboardStore.getState().decrementMissionsUnreadCount()
    const { error } = await supabase.from('missions').update({ is_read: true }).eq('id', id)
    if (error) {
      console.error('markMissionAsRead:', JSON.stringify(error, null, 2))
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm(t.dashboard.missions.deleteConfirm)) return
    try {
      const { data, error } = await supabase.from('missions').delete().eq('id', id).select('id')
      if (error) {
        console.error('[missions] delete error:', JSON.stringify(error, null, 2))
        toast.error(t.dashboard.missions.deleteError ?? 'Erreur lors de la suppression.')
        return
      }
      if (!data || data.length === 0) {
        console.error('[missions] delete: no row deleted (RLS or not found), mission id:', id)
        toast.error(t.dashboard.missions.deleteRlsError ?? 'Suppression refusée. Droits insuffisants ou mission introuvable.')
        return
      }
      setMissions((prev) => prev.filter((m) => m.id !== id))
      useDashboardStore.getState().deleteMission(id)
      setViewingReport(null)
      router.refresh()
    } catch (e) {
      console.error('[missions] delete exception:', e)
      toast.error(t.dashboard.missions.deleteError ?? 'Erreur lors de la suppression.')
    }
  }, [router, t.dashboard.missions.deleteConfirm, t.dashboard.missions.deleteError, t.dashboard.missions.deleteRlsError])

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-24">
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <FolderOpen size={28} className="text-indigo-400" />
          {t.dashboard.missions.title}
        </h1>

        {/* SECTION KPIs - Glassmorphism sombre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Target size={20} className="text-indigo-400" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.dashboard.missions.totalMissions}
              </span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{totalMissions}</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.dashboard.missions.successRate}
              </span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">{successRate}%</p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <DollarSign size={20} className="text-amber-400" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.dashboard.missions.budgetConsumed}
              </span>
            </div>
            <p className="text-3xl font-bold text-amber-400 tabular-nums">{totalCost} TK</p>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher une archive..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-11 px-5 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-500 transition-colors text-sm font-medium flex items-center gap-2 shrink-0"
          >
            <Download size={16} />
            {t.dashboard.missions.exportCSV}
          </button>
        </div>

        {/* TABLEAU AVANCÉ */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-gray-400 min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-3 md:px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.dashboard.missions.agent}
                  </th>
                  <th className="px-3 md:px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.dashboard.missions.mission}
                  </th>
                  <th className="px-3 md:px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {t.dashboard.missions.date}
                  </th>
                  <th className="px-3 md:px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.dashboard.missions.result}
                  </th>
                  <th className="px-3 md:px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">
                    {t.dashboard.missions.action}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMissions.map((mission) => (
                  <tr
                    key={mission.id}
                    className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-3 md:px-4 py-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                          {mission.agentName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-100">{mission.agentName}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-gray-300">
                      {mission.title.length > 50 ? mission.title.substring(0, 50) + '...' : mission.title}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                      {formatMissionDate(mission.date, LOCALE_MAP[currentLang] ?? 'fr-FR')}
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          mission.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : mission.status === 'Failed'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : mission.status === 'In Progress'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {mission.status === 'Completed' ? (
                          <>
                            <CheckCircle2 size={12} />
                            {t.dashboard.missions.success}
                          </>
                        ) : mission.status === 'Failed' ? (
                          <>
                            <XCircle size={12} />
                            {t.dashboard.missions.failed}
                          </>
                        ) : mission.status === 'In Progress' ? (
                          t.dashboard.missions.inProgress
                        ) : (
                          t.dashboard.missions.pending
                        )}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingReport(mission)
                          void markMissionAsRead(mission.id)
                        }}
                        className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 transition-colors"
                        title={t.dashboard.missions.viewReport}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 size={20} className="animate-spin" />
              <span>{t.dashboard.common?.loading ?? 'Chargement...'}</span>
            </div>
          )}
          {!loading && filteredMissions.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              {missions.length === 0
                ? t.dashboard.missions.noMissions
                : t.dashboard.missions.noSearchResults}
            </div>
          )}
        </div>
      </div>

      {/* MODALE DÉTAILS MISSION — Bilan de Fin de Mission (Rapport d'entreprise) */}
      {viewingReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => { setViewingReport(null); setLivrableApproved(false) }}
        >
          <div
            className="bg-[#f8f6f3] dark:bg-gray-900/95 border-2 border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence>
              {livrableApproved && (
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 8 }}
                  exit={{ scale: 1.05, opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none rounded-xl"
                >
                  <span className="px-10 py-5 rounded-lg border-4 border-emerald-600 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-2xl tracking-widest shadow-lg">
                    VALIDÉ
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* En-tête rapport — Rapport de Livrable */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shrink-0">
              <span className="text-xs font-black tracking-[0.25em] text-gray-700 dark:text-slate-300 uppercase">
                {t.dashboard.missions.reportTitle} — {(viewingReport.agentName ?? t.dashboard.missions.agent ?? 'Salarié').toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white p-1"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
              {/* SYNTHÈSE EXÉCUTIVE */}
              <section>
                <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500 mb-1.5">{t.dashboard.missions.synthesisExecutive}</h4>
                <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 p-4 shadow-inner text-gray-800 dark:text-slate-200 text-sm leading-relaxed min-h-[120px] max-h-[40vh] overflow-y-auto">
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-800 dark:prose-p:text-slate-200 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-300 dark:prose-pre:border-gray-600 prose-pre:rounded-lg prose-pre:p-4 prose-code:bg-gray-200 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-cyan-700 dark:prose-code:text-cyan-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {viewingReport.resultSnippet || "Erreur de transmission JSON"}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
              {/* ANALYSE DE PERFORMANCE */}
              <section>
                <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500 mb-1.5">{t.dashboard.missions.performanceAnalysis}</h4>
                <p className="text-sm text-gray-700 dark:text-slate-300">
                  Coût en Tokens : <span className="font-mono font-semibold">{viewingReport.cost} TK</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-slate-500">
                    · Temps de production : {new Date(viewingReport.date).toLocaleString(currentLang === 'ar' ? 'ar-SA' : currentLang === 'de' ? 'de-DE' : currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-US' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </p>
              </section>
              {/* Objet (référence) */}
              <section>
                <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500 mb-1.5">{t.dashboard.missions.objectLabel}</h4>
                <p className="text-sm font-semibold text-gray-900 dark:text-white border-l-4 border-cyan-600 dark:border-cyan-500 pl-3 py-1">
                  {viewingReport.title}
                </p>
              </section>
              {/* Lien de Synchronisation / Publication — Connecteur */}
              <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 p-4">
                <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-slate-500 mb-2">
                  {t.dashboard.missions.syncLinkLabel}
                </h4>
                <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
                  {t.dashboard.missions.syncLinkHint}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="https://hooks.zapier.com/... ou URL de votre Webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => handlePushToExternal(viewingReport)}
                    disabled={isSendingWebhook}
                    className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs gap-2"
                  >
                    {isSendingWebhook ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        {t.dashboard.missions.pushButton}
                      </>
                    )}
                  </Button>
                </div>
              </section>
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setViewingReport(null); setLivrableApproved(false) }}
                  className="px-5 py-3 min-h-[44px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg transition-colors"
                >
                  {t.dashboard.missions.archiveToRegister}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLivrableApproved(true)
                    confetti({ particleCount: 60, spread: 55, origin: { x: 0.5, y: 0.6 }, colors: ['#10B981', '#34D399', '#FBBF24'] })
                    setTimeout(() => setLivrableApproved(false), 2000)
                  }}
                  className="px-5 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg transition-colors"
                >
                  {t.dashboard.missions.approveDeliverable}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(viewingReport.id)}
                  className="flex items-center gap-2 px-3 py-3 min-h-[44px] text-red-500 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.dashboard.missions.archive}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs">
                      <Download className="w-4 h-4" />
                      Exporter
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 w-52">
                    <DropdownMenuItem onClick={() => handleExportPdf(viewingReport)} className="cursor-pointer">
                      <FileText className="w-4 h-4 mr-2" />
                      PDF (rapport officiel)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportCsv(viewingReport)} className="cursor-pointer">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportMd(viewingReport)} className="cursor-pointer">
                      <FileCode className="w-4 h-4 mr-2" />
                      Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportJson(viewingReport)} className="cursor-pointer">
                      <FileCode className="w-4 h-4 mr-2" />
                      JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onClick={() => handleCopy(viewingReport.resultSnippet ?? '')}
                  className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-lg"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {t.dashboard.missions.copyText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
