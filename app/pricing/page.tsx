"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Check, Zap, Rocket, Shield, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "14,90€",
    pricePeriod: "/mois",
    tagline: "Auto-entrepreneur",
    description: "Parfait pour débuter votre virtualisation",
    features: [
      "Budget 250 000 Tokens / mois",
      "Accès à 3 Salariés IA",
      "Vue QG 3D",
      "Historique missions (7 jours)",
      "Support par email",
    ],
    icon: Zap,
    gradient: "from-cyan-500 to-blue-500",
    borderColor: "border-cyan-900/40",
    hoverBorder: "hover:border-cyan-500/50",
    buttonClass: "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "49€",
    pricePeriod: "/mois",
    tagline: "Pour les agences",
    description: "L'armée IA complète pour votre entreprise",
    features: [
      "Budget 1 000 000 Tokens / mois",
      "Accès complet au catalogue Salariés",
      "Vue QG 3D Avancée",
      "Historique illimité & Export",
      "Connecteurs intégrés",
      "Support prioritaire",
    ],
    icon: Rocket,
    gradient: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/60",
    hoverBorder: "hover:border-violet-400",
    buttonClass: "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 border-0 shadow-[0_0_20px_rgba(139,92,246,0.4)]",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "129€",
    pricePeriod: "/mois",
    tagline: "Infrastructure lourde",
    description: "Collaboration équipe & API dédiée",
    features: [
      "Budget 3 000 000 Tokens / mois",
      "Salariés IA sur-mesure",
      "Collaboration en équipe",
      "Accès API SantarAI",
      "Gestionnaire de compte dédié",
      "Support VIP 24/7",
    ],
    icon: Shield,
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-900/40",
    hoverBorder: "hover:border-amber-500/50",
    buttonClass: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30",
    popular: false,
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Connexion requise", {
        description: "Veuillez vous connecter pour continuer",
      })
      router.push("/login")
      return
    }

    if (planId === "starter") {
      router.push("/dashboard")
      return
    }

    setLoading(planId)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userEmail: user.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session")
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("URL de checkout non reçue")
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Impossible de créer la session de paiement"
      toast.error("Erreur", { description: message })
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#020617]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Logo className="h-10 w-auto" />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground gap-2 text-xs sm:text-sm"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choisissez votre{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Formule
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Des solutions adaptées à chaque ambition. Sans engagement.
          </p>
        </div>

        {/* Cards — responsive grid, no scale on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isLoading = loading === plan.id

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border-2 bg-gray-950/60 backdrop-blur-sm p-6 sm:p-8 flex flex-col transition-all duration-300",
                  plan.popular
                    ? `${plan.borderColor} shadow-[0_0_30px_rgba(139,92,246,0.2)] md:scale-105`
                    : `${plan.borderColor} ${plan.hoverBorder}`
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      POPULAIRE
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5",
                    plan.gradient
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Plan info */}
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{plan.tagline}</p>
                <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.pricePeriod}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-3 mb-7">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={cn("w-full h-11 font-semibold", plan.buttonClass)}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion Stripe...</>
                  ) : plan.id === "starter" ? (
                    "Commencer gratuitement"
                  ) : plan.id === "enterprise" ? (
                    "Nous contacter"
                  ) : (
                    "S'abonner maintenant"
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          Paiement sécurisé via Stripe · Annulable à tout moment · Sans engagement
        </p>
      </div>
    </div>
  )
}
