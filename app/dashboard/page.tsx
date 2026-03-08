"use client"

import { useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useDashboardStore } from "@/lib/store"
import { DashboardQGV2 } from "@/components/dashboard/dashboard-qg-v2"
import { DashboardLoadingFallback } from "@/components/dashboard/DashboardLoadingFallback"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"

function DashboardContent() {
  const { user, loading } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const router = useRouter()
  const searchParams = useSearchParams()
  const updateSubscription = useDashboardStore((s) => s.updateSubscription)
  const addTransaction = useDashboardStore((s) => s.addTransaction)
  const paymentProcessedRef = useRef(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Réception Stripe : payment_success=true → crédit + grand livre (une seule fois)
  useEffect(() => {
    if (searchParams.get('payment_success') !== 'true') return
    if (paymentProcessedRef.current) return
    paymentProcessedRef.current = true

    const planParam = searchParams.get('plan') || 'PRO'
    const plan = ['STARTER', 'PRO', 'ENTERPRISE'].includes(planParam)
      ? (planParam as 'STARTER' | 'PRO' | 'ENTERPRISE')
      : 'PRO'
    const amount = parseInt(searchParams.get('amount') || '0', 10)

    updateSubscription(plan)
    if (amount > 0) {
      addTransaction(amount, 'CREDIT', `Abonnement ${plan} (Stripe Validé)`)
    }

    router.replace('/dashboard', { scroll: false })
    toast.success(t.dashboard.toast.paymentConfirmed, {
      description: `${amount > 0 ? amount.toLocaleString() + ' ' : ''}${t.dashboard.toast.tokensAdded}`,
      duration: 5000,
    })
  }, [searchParams, router, updateSubscription, addTransaction, t])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
          <p className="mt-4 text-muted-foreground">{t.dashboard.common.loading}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <DashboardQGV2 />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardContent />
    </Suspense>
  )
}
