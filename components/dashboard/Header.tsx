'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MessageSquare, Bell, Globe, ChevronDown, Rocket } from 'lucide-react'
import { useAgentStore } from '@/stores/useAgentStore'
import { useDashboardStore } from '@/lib/store'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations, LANG_OPTIONS } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export default function DashboardHeader() {
  const [mounted, setMounted] = useState(false)
  const { setSelectedAgent, setChatOpen } = useAgentStore()
  const missions = useDashboardStore((s) => s.missions)
  const pendingMissionsCount = missions.filter((m) => m.status === 'In Progress' || m.status === 'Pending').length
  const { currentLang, setLanguage } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const isRTL = currentLang === 'ar'

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#020617]/80 backdrop-blur-md z-40 sticky top-0">
      <div className="flex items-center gap-2 md:gap-4 text-slate-400 text-sm">
        <Search size={16} />
        <input
          type="text"
          placeholder={t.header.searchPlaceholder}
          className="bg-transparent outline-none w-32 md:w-64 placeholder:text-slate-600 text-xs md:text-sm"
        />
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Sélecteur de langue */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangMenuOpen((o) => !o)}
            onBlur={() => setTimeout(() => setLangMenuOpen(false), 150)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-colors text-xs"
            aria-label="Sélectionner la langue"
            aria-haspopup="listbox"
            aria-expanded={langMenuOpen}
          >
            <Globe size={14} aria-hidden />
            <span>{LANG_OPTIONS.find((o) => o.code === currentLang)?.flag ?? '🇫🇷'}</span>
            <span className="font-medium">{LANG_OPTIONS.find((o) => o.code === currentLang)?.label ?? 'FR'}</span>
            <ChevronDown size={12} className={`opacity-70 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          <div
            className={`absolute top-full mt-1 min-w-[120px] py-1 bg-[#0A0A0F] border border-white/10 rounded-lg shadow-xl transition-all z-50 ${
              isRTL ? 'left-0' : 'right-0'
            } ${langMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
          >
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLanguage(opt.code as Language)
                  setLangMenuOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-start text-xs hover:bg-white/10 transition-colors ${
                  currentLang === opt.code ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300'
                }`}
              >
                <span>{opt.flag}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedAgent(null)
            setChatOpen(true)
          }}
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          aria-label={t.header.openChat}
        >
          <MessageSquare size={18} />
        </button>
        {mounted ? (
          <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label={t.header.notifications}
              >
                <Bell size={18} />
                {pendingMissionsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full border border-[#020617]">
                    {pendingMissionsCount > 99 ? '99+' : pendingMissionsCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 bg-[#0A0A0F] border-white/10 text-slate-200 shadow-xl shadow-black/30"
            >
              <DropdownMenuLabel className="text-base font-semibold text-white py-2">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <div className="py-1">
                {pendingMissionsCount > 0 ? (
                  <Link
                    href="/dashboard/missions"
                    onClick={() => setNotifOpen(false)}
                    className="flex gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group"
                  >
                    <Rocket size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-indigo-300">Missions déployées</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pendingMissionsCount} mission{pendingMissionsCount !== 1 ? 's' : ''} en attente d&apos;exécution.
                      </p>
                    </div>
                  </Link>
                ) : (
                  <p className="px-3 py-4 text-sm text-slate-500">Aucune notification</p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            className="relative p-2 text-slate-400 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label={t.header.notifications}
          >
            <Bell size={18} />
          </button>
        )}
      </div>
    </header>
  )
}
