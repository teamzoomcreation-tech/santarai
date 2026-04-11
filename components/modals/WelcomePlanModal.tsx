'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Crown, Rocket, X, ArrowRight, Gift, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WelcomePlanModalProps {
  onClose: () => void
}

const FREE_LIMITS = {
  tokens: '25 000 TK',
  agents: '0 agent recruté',
  projects: '1 projet',
}

const PLANS = [
  {
    tier: 'STARTER',
    name: 'Starter',
    price: '14,90€/mois',
    tokens: '500 000 TK',
    agents: '5 agents',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
  },
  {
    tier: 'PRO',
    name: 'Pro',
    price: '49€/mois',
    tokens: '2 500 000 TK',
    agents: '20 agents',
    icon: Crown,
    color: 'from-indigo-500 to-purple-500',
    border: 'border-indigo-500/50',
    glow: 'shadow-indigo-500/20',
    popular: true,
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: '129€/mois',
    tokens: '15 000 000 TK',
    agents: 'Agents illimités',
    icon: Rocket,
    color: 'from-orange-500 to-red-500',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/10',
  },
]

export function WelcomePlanModal({ onClose }: WelcomePlanModalProps) {
  const router = useRouter()
  const [closing, setClosing] = useState(false)

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 200)
  }

  const handleChoosePlan = () => {
    handleClose()
    router.push('/dashboard/subscription')
  }

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0A0F1E] border border-white/10 shadow-2xl"
          >
            {/* Bouton fermer */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 text-center border-b border-white/5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                <Gift size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 tracking-wide">BIENVENUE SUR SANTARAI</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Votre compte est actif 🎉</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Vous êtes actuellement sur le plan <strong className="text-white">Gratuit</strong> avec des accès limités.
                Choisissez un plan pour libérer toute la puissance de vos agents IA.
              </p>
            </div>

            {/* Plan FREE (ce que l'utilisateur a maintenant) */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-white/5 mb-4">
                <Lock size={14} className="text-slate-500 shrink-0" />
                <div className="text-sm text-slate-400">
                  Plan actuel : <span className="text-white font-medium">Gratuit</span>
                  <span className="mx-2 text-slate-600">·</span>
                  {FREE_LIMITS.tokens}
                  <span className="mx-2 text-slate-600">·</span>
                  {FREE_LIMITS.agents}
                  <span className="mx-2 text-slate-600">·</span>
                  {FREE_LIMITS.projects}
                </div>
              </div>

              {/* Plans payants */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map((plan) => {
                  const Icon = plan.icon
                  return (
                    <div
                      key={plan.tier}
                      className={`relative rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.02] ${plan.border} ${plan.popular ? `shadow-lg ${plan.glow}` : ''}`}
                      onClick={handleChoosePlan}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full tracking-wider">
                          POPULAIRE
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="font-bold text-white text-sm mb-0.5">{plan.name}</div>
                      <div className="text-xs text-slate-400 mb-2">{plan.price}</div>
                      <div className="text-[11px] text-cyan-400 font-medium">{plan.tokens}</div>
                      <div className="text-[11px] text-slate-500">{plan.agents}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleChoosePlan}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20 min-h-[44px]"
              >
                Choisir mon plan
                <ArrowRight size={16} />
              </button>
              <button
                onClick={handleClose}
                className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-medium text-sm transition-colors min-h-[44px]"
              >
                Continuer en Gratuit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
