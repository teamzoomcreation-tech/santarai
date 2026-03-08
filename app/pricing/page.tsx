"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "Gratuit",
    description: "Parfait pour commencer",
    features: [
      "1 Agent IA",
      "5 000 crédits/mois",
      "Support par email",
      "Accès aux fonctionnalités de base",
    ],
    icon: Sparkles,
    gradient: "from-gray-500 to-gray-600",
    borderColor: "border-gray-700",
    buttonText: "Commencer gratuitement",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "19€",
    pricePeriod: "/mois",
    description: "Pour les professionnels",
    features: [
      "5 Agents IA",
      "50 000 crédits/mois",
      "Connecteurs API",
      "Support prioritaire",
      "Analytics avancés",
    ],
    icon: Zap,
    gradient: "from-cyan-500 to-blue-600",
    borderColor: "border-cyan-500/50",
    buttonText: "S'abonner",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    price: "49€",
    pricePeriod: "/mois",
    description: "Pour les équipes",
    features: [
      "Agents IA illimités",
      "Crédits illimités",
      "Tous les connecteurs",
      "Support 24/7",
      "Gestion d'équipe",
      "API personnalisée",
    ],
    icon: Crown,
    gradient: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/50",
    buttonText: "S'abonner",
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

    // Plan gratuit : redirection directe vers le dashboard
    if (planId === "starter") {
      router.push("/dashboard")
      return
    }

    // Plans payants : appel à l'API Stripe
    setLoading(planId)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: planId,
          userEmail: user.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session")
      }

      // Redirection vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("URL de checkout non reçue")
      }
    } catch (error: any) {
      console.error("Erreur lors de l'abonnement:", error)
      toast.error("Erreur", {
        description: error?.message || "Impossible de créer la session de paiement",
      })
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-cyan-900/20 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                <span className="text-cyan-400">SANTARAI</span>
              </h1>
              <p className="text-sm text-muted-foreground">Choisissez votre plan</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground"
            >
              Retour au Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Choisissez votre plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez l'offre qui correspond le mieux à vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isLoading = loading === plan.id

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border-2 bg-gray-950/50 backdrop-blur-sm p-8 flex flex-col",
                  plan.popular
                    ? `${plan.borderColor} shadow-[0_0_24px_rgba(34,211,238,0.2)] scale-105`
                    : "border-cyan-900/30"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
                      plan.gradient
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.pricePeriod && (
                      <span className="text-muted-foreground">{plan.pricePeriod}</span>
                    )}
                  </div>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                      : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
