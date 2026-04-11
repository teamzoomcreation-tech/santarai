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
import { WelcomePlanModal } from "@/components/modals/WelcomePlanModal"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

function DashboardContent() {
  const { user, loading } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const router = useRouter()
  const searchParams = useSearchParams()
  const fetchTreasury = useDashboardStore((s) => s.fetchTreasury)
  const paymentToastedRef = useRef(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  /**
   * SÉCURITÉ : le plan est UNIQUEMENT mis à jour par le webhook Stripe côté serveur.
   * Ici on affiche simplement un toast informatif et on recharge le solde depuis la DB.
   * Le paramètre payment_pending=true n'octroie AUCUN token ni aucun plan.
   */
  useEffect(() => {
    if (searchParams.get('payment_pending') !== 'true') return
    if (paymentToastedRef.current) return
    paymentToastedRef.current = true

    // Recharger le solde depuis la base — le webhook Stripe aura crédité les tokens
    if (user?.id) {
      setTimeout(() => fetchTreasury(user.id), 3000) // laisser le webhook traiter
      setTimeout(() => fetchTreasury(user.id), 8000) // second essai
    }

    toast.success('Paiement reçu — activation en cours…', {
      description: 'Votre plan sera activé dans quelques secondes.',
      duration: 6000,
    })

    router.replace('/dashboard', { scroll: false })
  }, [searchParams, router, user, fetchTreasury])

  const showWelcome = searchParams.get('welcome') === 'true'
  const showOnboarding = searchParams.get('onboarding') === 'true'

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

  if (!user) return null

  return (
    <>
      <DashboardQGV2 />
      {showWelcome && <WelcomePlanModal onClose={() => router.replace('/dashboard', { scroll: false })} />}
      {showOnboarding && <OnboardingWizard onComplete={() => router.replace('/dashboard', { scroll: false })} />}
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardContent />
    </Suspense>
  )
}
