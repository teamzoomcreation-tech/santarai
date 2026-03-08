"use client"

import { useDashboardStore } from "@/lib/store"
import { Terminal } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"

export function ActivityLogPanel() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const logs = useDashboardStore((s) => s.logs)

  const getSourceColor = (type: 'info' | 'success' | 'warning' | 'error') => {
    if (type === 'success') return 'text-green-400'
    if (type === 'warning') return 'text-yellow-400'
    if (type === 'error') return 'text-red-400'
    return 'text-blue-400'
  }

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="px-4 py-3 border-b border-green-500/30 shrink-0 bg-black">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-400" />
          <h3 className="text-sm font-semibold text-green-400 font-mono">{t.dashboard.activityLog.title}</h3>
          <span className="ml-auto text-xs text-green-400 font-mono">{logs.length} {t.dashboard.activityLog.events}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 font-mono">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[8rem]">
            <p className="text-gray-500 font-mono text-xs">{t.dashboard.activityLog.waiting}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {logs.map((log) => (
              <div key={log.id} className="text-xs font-mono mb-1">
                <span className="text-gray-500">[{log.time}]</span>
                <span className={`ml-2 font-bold ${getSourceColor(log.type)}`}>[{log.source}]</span>
                <span className="ml-2 text-gray-300">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
