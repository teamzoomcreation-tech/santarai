'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Folder, Users, Target, UserPlus, Database } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'

const NAV_KEYS = [
  { key: 'hq' as const, href: '/dashboard', icon: LayoutDashboard },
  { key: 'projects' as const, href: '/dashboard/projects', icon: Folder },
  { key: 'agents' as const, href: '/dashboard/agents', icon: Users },
  { key: 'resources' as const, href: '/dashboard/resources', icon: Database },
  { key: 'missions' as const, href: '/dashboard/missions', icon: Target },
  { key: 'recruit' as const, href: '/dashboard/recrutement', icon: UserPlus },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full bg-[#020617]/95 backdrop-blur-md border-t border-white/10 md:hidden pb-safe">
      <div className="flex justify-center py-2 border-b border-white/5 overflow-visible">
        <Logo href="/dashboard" className="h-12 w-auto" />
      </div>
      <div className="flex justify-around items-center h-16">
        {NAV_KEYS.map((item) => {
          const isActive = pathname === item.href
          const name = t.mobileNav[item.key]
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
