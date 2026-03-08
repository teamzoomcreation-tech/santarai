"use client"

import { useState } from "react"
import { Settings as SettingsIcon, Globe, CreditCard, Zap, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type SettingsTab = "general" | "integrations" | "billing"

interface Integration {
  id: string
  name: string
  description: string
  icon: any
  connected: boolean
  connecting?: boolean
}

const integrations: Integration[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Paiements et facturation automatisés",
    icon: CreditCard,
    connected: false,
  },
  {
    id: "google",
    name: "Google Workspace",
    description: "Gmail, Drive et calendrier",
    icon: Globe,
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Base de connaissances et documentation",
    icon: SettingsIcon,
    connected: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Notifications et communications d'équipe",
    icon: Zap,
    connected: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Réseau professionnel et prospection",
    icon: Globe,
    connected: false,
  },
]

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  const [companyName, setCompanyName] = useState("")
  const [currency, setCurrency] = useState("EUR")
  const [language, setLanguage] = useState("")
  const [integrationStates, setIntegrationStates] = useState<Record<string, boolean>>(
    integrations.reduce((acc, int) => ({ ...acc, [int.id]: int.connected }), {})
  )
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set())

  const handleSaveGeneral = () => {
    toast.success("Paramètres généraux sauvegardés", {
      description: "Vos préférences ont été mises à jour",
      duration: 2000,
    })
  }

  const handleConnectIntegration = async (integrationId: string) => {
    setConnectingIds((prev) => new Set(prev).add(integrationId))

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIntegrationStates((prev) => ({ ...prev, [integrationId]: true }))
    setConnectingIds((prev) => {
      const next = new Set(prev)
      next.delete(integrationId)
      return next
    })

    const integration = integrations.find((int) => int.id === integrationId)
    toast.success(`${integration?.name} connecté avec succès`, {
      description: "L'intégration est maintenant active",
      duration: 3000,
    })
  }

  const handleDisconnectIntegration = (integrationId: string) => {
    setIntegrationStates((prev) => ({ ...prev, [integrationId]: false }))
    const integration = integrations.find((int) => int.id === integrationId)
    toast.info(`${integration?.name} déconnecté`, {
      description: "L'intégration a été désactivée",
      duration: 2000,
    })
  }

  const menuItems = [
    { id: "general" as const, label: "Général", icon: SettingsIcon },
    { id: "integrations" as const, label: "Intégrations", icon: Zap },
    { id: "billing" as const, label: "Facturation", icon: CreditCard },
  ]

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Left Sidebar - Settings Menu */}
      <aside className="w-64 border-r border-cyan-900/20 bg-gray-950/50 backdrop-blur-sm flex flex-col overflow-hidden">
        <div className="border-b border-cyan-900/20 px-4 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Paramètres</h2>
          <p className="text-xs text-muted-foreground">Configuration de la plateforme</p>
        </div>
        <nav className="p-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mb-1",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_12px_rgba(34,211,238,0.1)] border border-cyan-500/30"
                    : "text-muted-foreground hover:bg-gray-800/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Paramètres Généraux</h3>
              <p className="text-sm text-muted-foreground">Configurez les préférences de base de votre entreprise</p>
            </div>

            <div className="max-w-2xl space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-foreground">
                  Nom de l'entreprise
                </Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-gray-900/50 border-cyan-900/30 text-foreground"
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-foreground">
                  Devise
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger
                    id="currency"
                    className="bg-gray-900/50 border-cyan-900/30 text-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-cyan-900/30">
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="USD">USD (Dollar US)</SelectItem>
                    <SelectItem value="GBP">GBP (Livre Sterling)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-foreground">
                  Langue de l'IA
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger
                    id="language"
                    className="bg-gray-900/50 border-cyan-900/30 text-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-cyan-900/30">
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSaveGeneral}
                  className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Settings */}
        {activeTab === "integrations" && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Intégrations</h3>
              <p className="text-sm text-muted-foreground">Connectez vos outils pour automatiser vos workflows</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => {
                const Icon = integration.icon
                const isConnected = integrationStates[integration.id]
                const isConnecting = connectingIds.has(integration.id)

                return (
                  <div
                    key={integration.id}
                    className={cn(
                      "group relative rounded-xl border bg-gray-900/50 p-5 backdrop-blur-sm transition-all",
                      isConnected
                        ? "border-emerald-500/30 hover:border-emerald-500/50"
                        : "border-cyan-900/30 hover:border-cyan-500/50"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "mb-4 flex h-12 w-12 items-center justify-center rounded-lg",
                        isConnected
                          ? "bg-emerald-500/10"
                          : "bg-cyan-500/10"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          isConnected ? "text-emerald-400" : "text-cyan-400"
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h4 className="mb-1 text-lg font-semibold text-foreground">{integration.name}</h4>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>

                    {/* Status & Action */}
                    <div className="flex items-center justify-between">
                      {isConnected ? (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-emerald-400">Connecté</span>
                          </div>
                          <Switch
                            checked={isConnected}
                            onCheckedChange={() => handleDisconnectIntegration(integration.id)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </>
                      ) : (
                        <Button
                          onClick={() => handleConnectIntegration(integration.id)}
                          disabled={isConnecting}
                          className="w-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connexion...
                            </>
                          ) : (
                            "Connecter"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Billing Settings */}
        {activeTab === "billing" && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">Facturation</h3>
              <p className="text-sm text-muted-foreground">Gérez votre abonnement et vos crédits</p>
            </div>

            <div className="max-w-2xl space-y-6">
              {/* Current Plan */}
              <div className="rounded-xl border border-cyan-900/30 bg-gray-900/50 p-6 backdrop-blur-sm">
                <h4 className="mb-4 text-lg font-semibold text-foreground">Plan Actuel</h4>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-cyan-400">Freemium</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accès aux fonctionnalités de base avec limitations
                </p>
              </div>

              {/* Credits Usage */}
              <div className="rounded-xl border border-cyan-900/30 bg-gray-900/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-foreground">Crédits utilisés</h4>
                  <span className="text-sm text-muted-foreground">12,847 / 50,000</span>
                </div>
                <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    style={{ width: "25.7%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">25.7% des crédits mensuels utilisés</p>
              </div>

              {/* Upgrade Button */}
              <div>
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500/10 to-violet-500/10 text-cyan-400 hover:from-cyan-500/20 hover:to-violet-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                >
                  Mettre à niveau
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
