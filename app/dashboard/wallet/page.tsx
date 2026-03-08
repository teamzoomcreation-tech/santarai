'use client'

import React, { useMemo } from 'react'
import { useDashboardStore, type Transaction } from '@/lib/store'
import { Wallet, Download, TrendingUp, TrendingDown, Banknote, PiggyBank } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SA' : locale === 'de' ? 'de-DE' : locale === 'es' ? 'es-ES' : locale === 'en' ? 'en-US' : 'fr-FR', {
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

/** Convertit la description store en libellé comptable : débit = "Versement Salaire [Nom]", crédit = "Apport en Capital (Plan [Nom])". */
function toLibelle(tx: Transaction): string {
  if (tx.type === 'CREDIT') {
    const m = tx.description.match(/Abonnement\s+(.+?)\s*\(/i) || tx.description.match(/Abonnement\s+(.+)/i)
    const plan = m ? m[1].trim() : tx.description
    return `Apport en Capital (Plan ${plan})`
  }
  // DEBIT
  const recrutement = tx.description.match(/Recrutement\s+(.+)/i)
  if (recrutement) return `Versement Salaire ${recrutement[1].trim()}`
  const mission = tx.description.match(/Mission\s*\([^)]*\):\s*(.+)/i) || tx.description.match(/Mission[^:]*:\s*(.+)/i)
  if (mission) return `Versement Salaire ${mission[1].trim()}`
  const messagerie = tx.description.match(/Messagerie[^:]*:\s*(.+)/i)
  if (messagerie) return `Versement Salaire ${messagerie[1].trim()}`
  const deploiement = tx.description.match(/Déploiement\s+équipe/i)
  if (deploiement) return `Versement Salaire (Équipe)`
  const deploiementAgents = tx.description.match(/Déploiement\s+\(agents/i)
  if (deploiementAgents) return `Versement Salaire (Équipe)`
  return tx.description
}

export default function WalletPage() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const tokens = useDashboardStore((s) => s.tokens)
  const treasuryLoading = useDashboardStore((s) => s.treasuryLoading)
  const transactions = useDashboardStore((s) => s.transactions)
  const missions = useDashboardStore((s) => s.missions)

  const { masseSalarialeMois, economieReference } = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const completed = missions.filter(
      (m) => m.status === 'Completed' && m.date >= startOfMonth
    )
    const masse = completed.reduce((sum, m) => sum + (m.cost || 0), 0)
    // Référence landing : Coût humain 2 500 €/mo, SantarAI 99 €/mo → Économie 2 401 €
    const economieReference = 2401
    return { masseSalarialeMois: masse, economieReference }
  }, [missions])

  const handleExportCSV = () => {
    const locale = currentLang === 'ar' ? 'ar-SA' : currentLang === 'de' ? 'de-DE' : currentLang === 'es' ? 'es-ES' : currentLang === 'en' ? 'en-US' : 'fr-FR'
    const header = `${t.dashboard.wallet.date};${t.dashboard.wallet.labelLibelle};${t.dashboard.wallet.reference};${t.dashboard.wallet.amount} (TK)\n`
    const rows = transactions
      .map(
        (tx) =>
          `${formatDate(tx.date, currentLang).replace(/;/g, ',')};${toLibelle(tx).replace(/;/g, ',')};${tx.id};${tx.type === 'CREDIT' ? '+' : '-'}${tx.amount}`
      )
      .join('\n')
    const csvContent = '\uFEFF' + header + rows
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SANTARAI_Grand_Livre_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#020617] text-white pb-24">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-indigo-400" />
          {t.dashboard.wallet.title}
        </h1>
        <p className="text-slate-400 text-sm md:text-base">{t.dashboard.wallet.subtitle}</p>
      </div>

      {/* Header financier : 3 encarts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="p-5 md:p-6 rounded-xl border border-white/10 bg-[#0B0F1A] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            <Banknote className="w-4 h-4" />
            {t.dashboard.wallet.availableTreasury}
          </div>
          <div className="text-2xl md:text-3xl font-black text-white tabular-nums">
            {treasuryLoading ? '—' : `${tokens.toLocaleString()} `}
            <span className="text-lg font-bold text-slate-500">TK</span>
          </div>
        </div>
        <div className="p-5 md:p-6 rounded-xl border border-white/10 bg-[#0B0F1A] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
            <TrendingDown className="w-4 h-4" />
            {t.dashboard.wallet.payrollMass}
          </div>
          <div className="text-2xl md:text-3xl font-black text-red-400 tabular-nums">
            {masseSalarialeMois.toLocaleString()}{' '}
            <span className="text-lg font-bold text-slate-500">TK</span>
          </div>
        </div>
        <div className="p-5 md:p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
            <PiggyBank className="w-4 h-4" />
            {t.dashboard.wallet.savingsRealized}
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 tabular-nums">
            {economieReference.toLocaleString('fr-FR')} <span className="text-lg font-bold text-slate-500">€ /mois</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Réf. comparatif coût humain vs SantarAI</p>
        </div>
      </div>

      {/* Journal de caisse */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold text-white">{t.dashboard.wallet.transactionHistory}</h2>
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors"
        >
          <Download size={18} />
          {t.dashboard.wallet.downloadLedger}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0B0F1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {t.dashboard.wallet.date}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {t.dashboard.wallet.labelLibelle}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {t.dashboard.wallet.reference}
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">
                  {t.dashboard.wallet.amount}
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500 text-sm">
                    {t.dashboard.wallet.noTransactions}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                      {formatDate(tx.date, currentLang)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{toLibelle(tx)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{tx.id}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold ${
                          tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {tx.type === 'CREDIT' ? '+' : '-'}
                        {tx.amount.toLocaleString()} TK
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
