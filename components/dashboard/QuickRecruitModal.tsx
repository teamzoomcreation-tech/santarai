'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import type { MarketAgent, MarketCategory } from '@/lib/catalog'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { translations } from '@/lib/i18n'

function getCategoryBorder(category: MarketCategory): string {
  switch (category) {
    case 'MARKETING':
      return 'border-pink-500/50 shadow-[0_0_20px_-5px_rgba(236,72,153,0.25)]'
    case 'TECH':
      return 'border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.25)]'
    case 'SALES':
      return 'border-green-500/50 shadow-[0_0_20px_-5px_rgba(34,197,94,0.25)]'
    case 'ADMIN':
      return 'border-slate-500/50 shadow-[0_0_20px_-5px_rgba(100,116,139,0.2)]'
    case 'DATA':
      return 'border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.25)]'
    case 'ELITE':
      return 'border-yellow-500/70 shadow-[0_0_25px_-5px_rgba(234,179,8,0.35)]'
    default:
      return 'border-slate-600/50'
  }
}

function getCategoryAvatar(category: MarketCategory): string {
  switch (category) {
    case 'MARKETING':
      return 'bg-pink-500/20 border-pink-500/40 text-pink-400'
    case 'TECH':
      return 'bg-blue-500/20 border-blue-500/40 text-blue-400'
    case 'SALES':
      return 'bg-green-500/20 border-green-500/40 text-green-400'
    case 'ADMIN':
      return 'bg-slate-500/20 border-slate-500/40 text-slate-400'
    case 'DATA':
      return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
    case 'ELITE':
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
    default:
      return 'bg-slate-500/20 border-slate-500/40 text-slate-400'
  }
}

export interface QuickRecruitModalProps {
  agent: MarketAgent
  onClose: () => void
  onRecruit: () => void
}

export function QuickRecruitModal({ agent, onClose, onRecruit }: QuickRecruitModalProps) {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const borderClass = getCategoryBorder(agent.category)
  const avatarClass = getCategoryAvatar(agent.category)
  const priceFormatted = agent.monthlyCost.toLocaleString()
  const [showStamp, setShowStamp] = useState(false)

  const handleSign = () => {
    setShowStamp(true)
    setTimeout(() => {
      setShowStamp(false)
      onRecruit()
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`w-full max-w-md bg-[#f8f6f3] dark:bg-[#f0ede8] border-2 border-gray-300 dark:border-gray-500 rounded-t-2xl shadow-2xl relative overflow-hidden ${borderClass}`}
        style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.15)' }}
      >
        <AnimatePresence>
          {showStamp && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
              animate={{ scale: 1.2, opacity: 1, rotate: 12 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className="px-10 py-5 rounded-lg border-4 border-emerald-600 bg-emerald-500/20 text-emerald-700 dark:text-emerald-600 font-black text-xl tracking-widest shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                style={{ textShadow: '0 0 20px rgba(16,185,129,0.5)' }}
              >
                APPROUVÉ
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200/80 transition-colors"
          aria-label={t.dashboard.contract.closeLabel}
        >
          <X size={18} />
        </button>

        <div className="p-6 pt-8">
          <h2 className="text-center text-[10px] font-black tracking-[0.35em] text-gray-600 dark:text-gray-600 uppercase mb-6">
            {t.dashboard.contract.title}
          </h2>

          <div className="flex items-start gap-4 mb-5">
            <div
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold flex-shrink-0 ${avatarClass}`}
            >
              {agent.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-0.5">
                {t.dashboard.contract.salarieLabel}
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-0.5">{agent.name}</h3>
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-600 uppercase tracking-wider mb-1">
                {t.dashboard.contract.roleLabel}
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-800">
                {agent.role}
              </p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-white/80 dark:bg-gray-100/80 border border-gray-200 dark:border-gray-300">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              {t.dashboard.contract.costLabel}
            </p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-800 tabular-nums flex items-center gap-2">
              <Zap size={20} className="text-amber-600" />
              {priceFormatted} TK
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              {t.dashboard.contract.cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleSign}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 border-2 border-emerald-700 dark:border-emerald-600 transition-colors text-sm font-black uppercase tracking-wider shadow-lg"
            >
              {t.dashboard.contract.signButton}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
