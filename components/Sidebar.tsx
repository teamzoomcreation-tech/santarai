'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, FolderOpen, Folder, Settings, Diamond, LogOut, Wallet, Database } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Logo } from '@/components/ui/logo'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'

const MENU_KEYS = [
  { key: 'viewHQ' as const, href: '/dashboard', icon: LayoutDashboard },
  { key: 'projects' as const, href: '/dashboard/projects', icon: Folder },
  { key: 'agents' as const, href: '/dashboard/agents', icon: Users },
  { key: 'recruitment' as const, href: '/dashboard/recrutement', icon: UserPlus },
  { key: 'treasury' as const, href: '/dashboard/wallet', icon: Wallet },
  { key: 'resources' as const, href: '/dashboard/resources', icon: Database },
  { key: 'missions' as const, href: '/dashboard/missions', icon: FolderOpen },
  { key: 'settings' as const, href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr

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
      <nav className="flex-1 px-4 space-y-2 mt-4">
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
              {isActive && <div className="ms-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_currentColor]"></div>}
            </Link>
          )
        })}
      </nav>

      {/* BOTTOM */}
      <div className="p-4 mt-auto border-t border-white/5">
        <Link 
          href="/dashboard/subscription"
          className="bg-slate-900/50 p-3 rounded-xl border border-white/5 mb-4 block hover:bg-slate-800/50 transition-colors"
        >
           <div className="flex items-center gap-2 mb-2">
              <Diamond size={16} className="text-indigo-400" />
              <span className="text-xs font-bold text-white">{t.sidebar.planPro}</span>
           </div>
           <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className="w-[70%] h-full bg-indigo-500"></div>
           </div>
        </Link>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 text-slate-500 hover:text-red-400 transition-colors w-full px-2 text-sm"
        >
            <LogOut size={16} /> {t.sidebar.logout}
        </button>
      </div>
    </div>
  )
}
