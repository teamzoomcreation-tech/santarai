'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Folder, Users, Target, UserPlus,
  Database, Wallet, Settings, MoreHorizontal, X, LogOut,
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useAuth } from '@/contexts/auth-context'
import { translations } from '@/lib/i18n'

// Navigation principale (5 items les plus utilisés)
const PRIMARY_NAV = [
  { key: 'hq' as const,       href: '/dashboard',              icon: LayoutDashboard },
  { key: 'projects' as const,  href: '/dashboard/projects',     icon: Folder },
  { key: 'agents' as const,    href: '/dashboard/agents',       icon: Users },
  { key: 'missions' as const,  href: '/dashboard/missions',     icon: Target },
  { key: 'recruit' as const,   href: '/dashboard/recrutement',  icon: UserPlus },
]

// Items dans le drawer "Plus"
const MORE_NAV = [
  { key: 'wallet' as const,    href: '/dashboard/wallet',       icon: Wallet },
  { key: 'resources' as const, href: '/dashboard/resources',    icon: Database },
  { key: 'settings' as const,  href: '/dashboard/settings',     icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const [moreOpen, setMoreOpen] = useState(false)

  const handleNav = (href: string) => {
    setMoreOpen(false)
    router.push(href)
  }

  const handleSignOut = async () => {
    setMoreOpen(false)
    await signOut()
    router.push('/login')
  }

  const isMoreActive = MORE_NAV.some((item) => pathname === item.href)

  return (
    <>
      {/* Overlay backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* Drawer "Plus" panneau */}
      <div
        className={`fixed bottom-[80px] left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out ${
          moreOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-4 bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </span>
            <button
              onClick={() => setMoreOpen(false)}
              className="p-1 text-slate-500 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-2 space-y-1">
            {MORE_NAV.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const label = t.mobileNav[item.key]
              return (
                <button
                  key={item.href}
                  onClick={() => handleNav(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              )
            })}
          </div>

          <div className="p-2 border-t border-white/5">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut size={18} />
              {t.sidebar.logout}
            </button>
          </div>
        </div>
      </div>

      {/* Barre navigation fixe en bas */}
      <nav
        className="fixed bottom-0 left-0 z-40 w-full bg-[#020617]/95 backdrop-blur-md border-t border-white/10 md:hidden"
        aria-label="Navigation principale mobile"
      >
        <div className="flex justify-center py-1.5 border-b border-white/5">
          <Logo href="/dashboard" className="h-8 w-auto" />
        </div>

        <div className="flex justify-around items-center h-14">
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const label = t.mobileNav[item.key]
            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="text-[9px] font-medium leading-tight">{label}</span>
              </button>
            )
          })}

          {/* Bouton Plus → ouvre le drawer */}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
              isMoreActive || moreOpen ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            aria-label="Autres pages"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={18} strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.75} />
            <span className="text-[9px] font-medium leading-tight">
              {t.mobileNav.more}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
