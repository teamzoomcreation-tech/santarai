'use client'

import React, { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import GlobalChat from '@/components/GlobalChat'
import DashboardHeader from '@/components/dashboard/Header'
import { useAgentStore } from '@/stores/useAgentStore'
import { useDashboardStore } from '@/lib/store'
import { useAuth } from '@/contexts/auth-context'

const SYSTEM_AGENT = {
  id: 'system',
  name: 'SANTARAI SYSTEM',
  role: 'Intelligence Centrale',
  avatar: 'S',
  systemPrompt: 'Tu es le système central Santarai. Tu es calme et analytique.',
} as const

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { selectedAgent, setSelectedAgent, isChatOpen, setChatOpen } = useAgentStore()
  const tick = useDashboardStore((s) => s.tick)
  const fetchTreasury = useDashboardStore((s) => s.fetchTreasury)
  const syncAgentsFromSupabase = useDashboardStore((s) => s.syncAgentsFromSupabase)

  useEffect(() => {
    if (user?.id) {
      fetchTreasury(user.id)
      syncAgentsFromSupabase(user.id)
    } else {
      useDashboardStore.setState({ treasuryLoading: false })
    }
  }, [user?.id, fetchTreasury, syncAgentsFromSupabase])

  useEffect(() => {
    if (selectedAgent && selectedAgent.id !== 'system') {
      setChatOpen(true)
    }
  }, [selectedAgent, setChatOpen])

  useEffect(() => {
    const interval = setInterval(() => {
      tick()
    }, 1000)
    return () => clearInterval(interval)
  }, [tick])

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">
      {/* Sidebar (gauche en LTR, droite en RTL) */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 start-0 z-50">
        <Sidebar />
      </div>

      {/* Contenu principal (ms-64 = marge logique pour laisser place à la sidebar) */}
      <main className="flex-1 flex flex-col md:ms-64 h-full relative overflow-y-auto overflow-x-hidden">
        <DashboardHeader />

        <div className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </div>
      </main>

      {/* Navigation mobile (barre du bas) */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Widget Chat flottant (bulle en bas à droite) */}
      <GlobalChat
        agent={selectedAgent ?? SYSTEM_AGENT}
        onClose={() => setChatOpen(false)}
        onResetAgent={() => setSelectedAgent(null)}
        isFloating={true}
      />
    </div>
  )
}
