'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Language } from '@/lib/i18n'

const STORAGE_KEY = 'santarai-lang'

function getStoredLang(): Language {
  if (typeof window === 'undefined') return 'fr'
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored && ['fr', 'en', 'es', 'de', 'ar'].includes(stored)) return stored
  const browserLang = navigator.language
  if (browserLang.startsWith('en')) return 'en'
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('de')) return 'de'
  if (browserLang.startsWith('ar')) return 'ar'
  return 'fr'
}

function applyDocumentDirection(lang: Language) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

interface LanguageContextValue {
  currentLang: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState<Language>('fr')

  const setLanguage = useCallback((lang: Language) => {
    setCurrentLang(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang)
      applyDocumentDirection(lang)
    }
  }, [])

  useEffect(() => {
    const initialLang = getStoredLang()
    setCurrentLang(initialLang)
    applyDocumentDirection(initialLang)
  }, [])

  const value: LanguageContextValue = {
    currentLang,
    setLanguage,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}
