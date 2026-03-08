"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, UserPlus, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MARKET_CATALOG, type MarketCategory, type MarketAgent } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type MissingRole = MarketCategory | "LEGAL"

const CATEGORY_LABELS: Record<MarketCategory | "LEGAL", string> = {
  MARKETING: "Marketing",
  TECH: "Tech",
  SALES: "Vente",
  ADMIN: "Admin",
  DATA: "Data",
  ELITE: "Elite",
  LEGAL: "Legal (Daimyo)",
}

const CATEGORY_COLORS: Record<MarketCategory | "LEGAL", string> = {
  MARKETING: "border-pink-500/50 bg-pink-500/10",
  TECH: "border-blue-500/50 bg-blue-500/10",
  SALES: "border-green-500/50 bg-green-500/10",
  ADMIN: "border-slate-500/50 bg-slate-500/10",
  DATA: "border-cyan-500/50 bg-cyan-500/10",
  ELITE: "border-yellow-500/50 bg-yellow-500/10",
  LEGAL: "border-amber-500/50 bg-amber-500/10",
}

function getAgentsForRole(role: MissingRole): MarketAgent[] {
  if (role === "LEGAL") {
    const daimyo = MARKET_CATALOG.find((a) => a.name === "DAIMYO")
    return daimyo ? [daimyo] : []
  }
  return MARKET_CATALOG.filter((a) => a.category === role).sort((a, b) => a.monthlyCost - b.monthlyCost)
}

function getCheapestForRole(role: MissingRole): MarketAgent | null {
  const agents = getAgentsForRole(role)
  return agents[0] ?? null
}

export type UpsellSelection = Partial<Record<MissingRole, { id: string; name: string; monthlyCost: number }>>

interface UpsellModalProps {
  open: boolean
  onClose: () => void
  missingRoles: MissingRole[]
  estimatedCost?: number
  /** Déployer l'équipe avec les agents sélectionnés (ids + coût total pour recruitTeam) */
  onDeployTeam?: (selectedAgentIds: string[], selections: UpsellSelection, totalCost: number) => void
  isDeploying?: boolean
}

export function UpsellModal({ open, onClose, missingRoles, estimatedCost = 0, onDeployTeam, isDeploying = false }: UpsellModalProps) {
  const router = useRouter()

  const [selectedByRole, setSelectedByRole] = useState<Partial<Record<MissingRole, MarketAgent>>>({})

  const agentsByRole = useMemo(
    () => Object.fromEntries(missingRoles.map((r) => [r, getAgentsForRole(r)])) as Record<MissingRole, MarketAgent[]>,
    [missingRoles]
  )

  useEffect(() => {
    if (!open || missingRoles.length === 0) return
    const initial: Partial<Record<MissingRole, MarketAgent>> = {}
    missingRoles.forEach((role) => {
      const cheapest = getCheapestForRole(role)
      if (cheapest) initial[role] = cheapest
    })
    setSelectedByRole(initial)
  }, [open, missingRoles])

  const exactTotal = useMemo(() => {
    return missingRoles.reduce((sum, role) => sum + (selectedByRole[role]?.monthlyCost ?? 0), 0)
  }, [missingRoles, selectedByRole])

  const allRolesSelected = missingRoles.length > 0 && missingRoles.every((r) => selectedByRole[r] != null)
  const primaryFilter = (missingRoles[0] === "LEGAL" ? "ELITE" : missingRoles[0]) ?? "MARKETING"

  const handleSelect = (role: MissingRole, agent: MarketAgent) => {
    setSelectedByRole((prev) => ({ ...prev, [role]: agent }))
  }

  const handleDeployTeam = () => {
    const selectedAgentIds: string[] = missingRoles
      .map((r) => selectedByRole[r]?.id)
      .filter((id): id is string => typeof id === "string")
    const totalCost = exactTotal
    console.log("Tentative de déploiement avec les IDs :", selectedAgentIds, "Coût total :", totalCost)
    if (selectedAgentIds.length === 0) {
      toast.error("Veuillez sélectionner un agent pour chaque rôle.")
      return
    }
    if (!onDeployTeam || isDeploying || !allRolesSelected) return
    const selections: UpsellSelection = {}
    missingRoles.forEach((r) => {
      const a = selectedByRole[r]!
      selections[r] = { id: a.id, name: a.name, monthlyCost: a.monthlyCost }
    })
    onDeployTeam(selectedAgentIds, selections, totalCost)
  }

  const handleRecruitment = () => {
    onClose()
    router.push(`/dashboard/recrutement?filter=${primaryFilter}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border border-cyan-500/30",
          "bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ressources Manquantes détectées</h2>
              <p className="text-sm text-slate-400">Choisissez un agent par rôle, puis déployez.</p>
            </div>
          </div>

          <p className="text-slate-300 mb-4">
            Rôles nécessaires :{" "}
            <span className="font-semibold text-cyan-400">{missingRoles.map((r) => CATEGORY_LABELS[r]).join(", ")}</span>
          </p>

          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
            {missingRoles.map((role) => (
              <div key={role}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  {CATEGORY_LABELS[role]} — sélectionnez un agent
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(agentsByRole[role] ?? []).map((agent) => {
                    const isSelected = selectedByRole[role]?.id === agent.id
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => handleSelect(role, agent)}
                        className={cn(
                          "rounded-xl border p-3 flex items-center gap-2 text-left transition-all",
                          agent.name === "DAIMYO" ? CATEGORY_COLORS.LEGAL : CATEGORY_COLORS[agent.category],
                          isSelected
                            ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-cyan-500/20"
                            : "hover:border-white/30"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-sm font-bold text-slate-200">
                          {agent.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{agent.name}</p>
                          <p className="text-xs text-slate-400 truncate">{agent.role}</p>
                          <p className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                            <Zap size={10} />
                            {agent.monthlyCost.toLocaleString()} TK
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-300 mb-4">
            Coût exact (sélection actuelle) :{" "}
            <span className="font-bold text-cyan-400">{exactTotal.toLocaleString()} TK</span>
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {onDeployTeam ? (
                <Button
                  onClick={handleDeployTeam}
                  disabled={!allRolesSelected || isDeploying}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  {isDeploying ? (
                    <span className="animate-pulse">Déploiement...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Déployer l&apos;équipe ({exactTotal.toLocaleString()} TK)
                    </>
                  )}
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={handleRecruitment}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Aller au Recrutement
              </Button>
            </div>
            <Button variant="ghost" onClick={onClose} className="w-full text-slate-400 hover:text-slate-300">
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
