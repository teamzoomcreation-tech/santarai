"use client"

import React from "react"
import Image from "next/image"
import { X, Shield, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface MissionPlan {
  objective: string
  name: string
  description: string
  missions: { title: string; agent_name: string | null; description?: string; cost?: number }[]
  team: string[]
  totalCost: number
}

interface MissionBriefingModalProps {
  open: boolean
  onClose: () => void
  plan: MissionPlan | null
  onConfirm: () => void
  isExecuting?: boolean
}

export function MissionBriefingModal({ open, onClose, plan, onConfirm, isExecuting = false }: MissionBriefingModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl border-2 border-amber-500/30",
          "bg-[#0A0A0F] backdrop-blur-xl shadow-2xl shadow-amber-500/10",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-950/20 to-transparent pointer-events-none" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="relative p-6 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200/90 uppercase tracking-wider">Dossier de Mission</h2>
              <p className="text-xs text-slate-500">Confidentiel — Top Secret</p>
            </div>
          </div>

          {plan ? (
            <>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Objectif</label>
                  <p className="text-white font-medium mt-1">{plan.objective}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</label>
                  <p className="text-slate-300 text-sm mt-1">{plan.name}</p>
                  {plan.description && (
                    <p className="text-slate-500 text-xs mt-0.5">{plan.description}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Équipe mobilisée</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {plan.team.length > 0 ? (
                      plan.team.map((name) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5"
                        >
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20">
                            <Image
                              src="/avatars/agent-base.png"
                              alt={name}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <span className="text-sm font-medium text-cyan-400">{name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">Aucun agent assigné</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Missions</label>
                  <ul className="mt-2 space-y-2">
                    {plan.missions.map((m, i) => (
                      <li key={i} className="flex justify-between items-start gap-2 text-sm">
                        <span className="text-slate-300">{m.title}</span>
                        <span className="text-cyan-400 shrink-0">{m.agent_name ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-400">Coût total estimé</span>
                    <span className="text-xl font-bold text-amber-400">{plan.totalCost} TK</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-white/20 hover:bg-white/10"
                >
                  Annuler la mission
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isExecuting}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold"
                >
                  {isExecuting ? (
                    "Déploiement en cours..."
                  ) : (
                    <>
                      <Rocket size={16} className="mr-2" />
                      Autoriser le déploiement
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-center py-8">Aucun plan chargé</p>
          )}
        </div>
      </div>
    </div>
  )
}
