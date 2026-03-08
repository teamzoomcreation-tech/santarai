'use client'

import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'

export function DashboardLoadingFallback() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
        <p className="mt-4 text-muted-foreground">{t.dashboard.common.loading}</p>
      </div>
    </div>
  )
}
