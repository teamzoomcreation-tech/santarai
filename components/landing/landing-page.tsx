"use client"

import { useState } from "react"
import { ArrowRight, Check, Zap, Rocket, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

interface LandingPageProps {
  onLaunchPlatform: () => void
}

export function LandingPage({ onLaunchPlatform }: LandingPageProps) {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

  const plans = [
    {
      id: "starter",
      name: "STARTER",
      price: "14,90",
      period: "/mois",
      description: "Parfait pour débuter",
      features: [
        "250k Tokens",
        "3 Salariés",
        "Support par email",
        "Mises à jour régulières",
      ],
      icon: Zap,
      color: "cyan",
      popular: false,
    },
    {
      id: "pro",
      name: "PRO",
      price: "49",
      period: "/mois",
      description: "Pour les équipes ambitieuses",
      features: [
        "1M Tokens",
        "Accès Complet",
        "Connecteurs intégrés",
        "Support prioritaire",
        "Formation personnalisée",
      ],
      icon: Rocket,
      color: "violet",
      popular: true,
    },
    {
      id: "enterprise",
      name: "ENTERPRISE",
      price: "129",
      period: "/mois",
      description: "Collaboration Équipe",
      features: [
        "3M Tokens",
        "Collaboration Équipe",
        "Support 24/7 dédié",
        "API personnalisée",
        "Gestionnaire de compte dédié",
        "Formation sur site",
      ],
      icon: Shield,
      color: "amber",
      popular: false,
    },
  ]

  const colorConfig: Record<string, string> = {
    cyan: "from-cyan-500 to-blue-600",
    violet: "from-violet-500 to-purple-600",
    amber: "from-amber-500 to-orange-600",
  }

  const textColorConfig: Record<string, string> = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="mb-8 flex justify-center h-auto min-h-[100px] items-center overflow-visible">
          <Logo className="h-24 w-auto" />
        </div>

        {/* Main Title */}
        <h2 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Virtualisez votre{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            Entreprise
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mb-12 max-w-2xl text-xl text-muted-foreground md:text-2xl">
          L&apos;Intelligence Collective au service de votre Empire.
        </p>

        {/* CTA Button */}
        <Button
          onClick={onLaunchPlatform}
          size="lg"
          className="group bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:from-cyan-600 hover:to-violet-600 border-0 shadow-[0_0_30px_rgba(34,211,238,0.3)] text-lg px-8 py-6 h-auto"
        >
          Lancer la plateforme
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-8 w-px bg-gradient-to-b from-cyan-400 to-transparent" />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h3 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Choisissez votre{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Formule
              </span>
            </h3>
            <p className="text-lg text-muted-foreground">
              Des solutions adaptées à tous les besoins
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => {
              const Icon = plan.icon
              const colorClasses = colorConfig[plan.color] || colorConfig.cyan
              const textColor = textColorConfig[plan.color] || textColorConfig.cyan

              return (
                <div
                  key={plan.id}
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  className={cn(
                    "group relative rounded-2xl border bg-gray-900/50 p-8 backdrop-blur-sm transition-all duration-300",
                    plan.popular
                      ? "border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.2)] scale-105"
                      : "border-cyan-900/30 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
                  )}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-1 text-xs font-semibold text-white">
                        POPULAIRE
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br",
                      colorClasses
                    )}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h4 className="mb-2 text-2xl font-bold text-foreground">{plan.name}</h4>
                  <p className="mb-6 text-sm text-muted-foreground">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">{plan.price}€</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={cn("mt-0.5 h-5 w-5 shrink-0", textColor)} />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={onLaunchPlatform}
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 border-0"
                        : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                    )}
                  >
                    {plan.id === "enterprise" ? "Nous contacter" : "Commencer"}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-900/20 bg-gray-950/50 px-6 py-12">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-12 w-auto text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SANTARAI. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
