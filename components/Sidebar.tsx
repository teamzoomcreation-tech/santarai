'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, FolderOpen, Folder, Settings, Diamond, LogOut, Wallet, Database, Zap, Crown, Rocket, Lock, Plug } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Logo } from '@/components/ui/logo'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'
import { useDashboardStore, type SubscriptionTier } from '@/lib/store'

const MENU_KEYS = [
  { key: 'viewHQ' as const, href: '/dashboard', icon: LayoutDashboard },
  { key: 'projects' as const, href: '/dashboard/projects', icon: Folder },
  { key: 'agents' as const, href: '/dashboard/agents', icon: Users },
  { key: 'recruitment' as const, href: '/dashboard/recrutement', icon: UserPlus },
  { key: 'treasury' as const, href: '/dashboard/wallet', icon: Wallet },
  { key: 'resources' as const, href: '/dashboard/resources', icon: Database },
  { key: 'missions' as const, href: '/dashboard/missions', icon: FolderOpen },
  { key: 'settings' as const, href: '/dashboard/settings', icon: Settings },
  { key: 'integrations' as const, href: '/dashboard/integrations', icon: Plug },
]

const PLAN_DISPLAY: Record<SubscriptionTier, { label: string; icon: typeof Zap; color: string; bg: string; border: string; progress: number }> = {
  FREE: {
    label: 'Gratuit',
    icon: Lock,
    color: 'text-slate-400',
    bg: 'bg-slate-800/50',
    border: 'border-slate-700/50',
    progress: 5,
  },
  STARTER: {
    label: 'Starter',
    icon: Zap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    progress: 33,
  },
  PRO: {
    label: 'Pro',
    icon: Crown,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    progress: 66,
  },
  ENTERPRISE: {
    label: 'Enterprise',
    icon: Rocket,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    progress: 100,
  },
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const subscriptionTier = useDashboardStore((s) => s.subscriptionTier)
  const tokens = useDashboardStore((s) => s.tokens)

  const plan = PLAN_DISPLAY[subscriptionTier] ?? PLAN_DISPLAY.FREE
  const PlanIcon = plan.icon

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="w-64 h-screen bg-[#020617] border-e border-white/5 flex flex-col flex-shrink-0 z-50">
      {/* LOGO */}
      <div className="px-6 py-4 flex items-center h-auto min-h-[80px] overflow-visible">
        <Logo className="h-20 w-auto" />
      </div>

      {/* MENU */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
        {MENU_KEYS.map((item) => {
          const isActive = pathname === item.href
          const name = t.sidebar[item.key]
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-blue-900/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {name}
              {isActive && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_currentColor]" />}
            </Link>
          )
        })}
      </nav>

      {/* BOTTOM — Plan + Déconnexion */}
      <div className="p-4 mt-auto border-t border-white/5 space-y-3">
        {/* Widget plan actuel */}
        <Link
          href="/dashboard/subscription"
          className={`block p-3 rounded-xl border transition-colors hover:brightness-110 ${plan.bg} ${plan.border}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <PlanIcon size={14} className={plan.color} />
            <span className={`text-xs font-bold ${plan.color}`}>{plan.label}</span>
            {subscriptionTier === 'FREE' && (
              <span className="ms-auto text-[10px] text-slate-500 font-medium">UPGRADER →</span>
            )}
          </div>
          {/* Barre tokens */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Tokens</span>
            <span className={plan.color}>{tokens.toLocaleString()} TK</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                subscriptionTier === 'FREE' ? 'bg-slate-600' :
                subscriptionTier === 'STARTER' ? 'bg-blue-500' :
                subscriptionTier === 'PRO' ? 'bg-indigo-500' : 'bg-orange-500'
              }`}
              style={{ width: `${plan.progress}%` }}
            />
          </div>
        </Link>

        {/* Déconnexion */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 text-slate-500 hover:text-red-400 transition-colors w-full px-2 py-2 text-sm min-h-[44px]"
        >
          <LogOut size={16} /> {t.sidebar.logout}
        </button>
      </div>
    </div>
  )
}
