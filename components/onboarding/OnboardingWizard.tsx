'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, Target, Zap, ArrowRight, ArrowLeft,
  Check, X, Briefcase, ShoppingCart, Scale, Heart, BarChart3, Code2
} from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { useAuth } from '@/contexts/auth-context'

const SECTORS = [
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
  { id: 'immobilier', label: 'Immobilier', icon: Building2 },
  { id: 'juridique', label: 'Juridique', icon: Scale },
  { id: 'sante', label: 'Santé', icon: Heart },
  { id: 'marketing', label: 'Marketing', icon: Target },
  { id: 'tech', label: 'Tech / SaaS', icon: Code2 },
  { id: 'rh', label: 'RH', icon: Users },
  { id: 'finance', label: 'Finance', icon: BarChart3 },
  { id: 'autre', label: 'Autre', icon: Briefcase },
]

const GOALS = [
  { id: 'content', label: 'Créer du contenu (posts, articles, emails)' },
  { id: 'analyse', label: 'Analyser des données et tendances' },
  { id: 'prospection', label: 'Automatiser la prospection commerciale' },
  { id: 'support', label: 'Améliorer mon support client' },
  { id: 'admin', label: 'Gérer des tâches administratives' },
  { id: 'seo', label: 'Optimiser mon référencement SEO' },
]

const TEAM_SIZES = [
  { id: 'solo', label: 'Solo / Freelance' },
  { id: 'small', label: '2 – 10 personnes' },
  { id: 'medium', label: '11 – 50 personnes' },
  { id: 'large', label: '50+ personnes' },
]

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const updateSettings = useDashboardStore((s) => s.updateSettings)

  const [step, setStep] = useState(0)
  const [sector, setSector] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [teamSize, setTeamSize] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')

  const STEPS = [
    { title: 'Bienvenue !', subtitle: 'Configurons votre espace SANTARAI en 5 étapes.' },
    { title: 'Votre secteur', subtitle: 'Nous adapterons vos agents à votre domaine.' },
    { title: 'Vos objectifs', subtitle: 'Qu\'attendez-vous de vos agents IA ?' },
    { title: 'Votre équipe', subtitle: 'Pour calibrer vos besoins.' },
    { title: 'Votre entreprise', subtitle: 'Pour personnaliser les outputs de vos agents.' },
  ]

  const totalSteps = STEPS.length
  const progress = ((step + 1) / totalSteps) * 100

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    updateSettings({
      name: companyName,
      website,
      industry: sector,
      size: teamSize,
    })
    onComplete()
    router.push('/dashboard/recrutement')
  }

  const canProceed = () => {
    if (step === 1) return !!sector
    if (step === 2) return goals.length > 0
    if (step === 3) return !!teamSize
    return true
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md">
      <div className="w-full max-w-lg">
        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Étape {step + 1} sur {totalSteps}</span>
            <button onClick={onComplete} className="hover:text-white transition-colors p-1">
              <X size={14} />
            </button>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0A0F1E] rounded-2xl border border-white/10 p-6 sm:p-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{STEPS[step].title}</h2>
            <p className="text-sm text-slate-400 mb-6">{STEPS[step].subtitle}</p>

            {/* STEP 0 — Accueil */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-sm text-indigo-300">
                    👋 Bonjour {user?.user_metadata?.name || 'là'} ! En quelques questions,
                    nous allons configurer votre équipe d'agents IA idéale.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '🤖', label: 'Agents IA' },
                    { icon: '⚡', label: 'Automatisation' },
                    { icon: '📊', label: 'Résultats' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-xs font-medium text-slate-300">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1 — Secteur */}
            {step === 1 && (
              <div className="grid grid-cols-3 gap-2">
                {SECTORS.map((s) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSector(s.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all min-h-[80px] ${
                        sector === s.id
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      {s.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* STEP 2 — Objectifs */}
            {step === 2 && (
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-sm text-left transition-all min-h-[52px] ${
                      goals.includes(g.id)
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      goals.includes(g.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                    }`}>
                      {goals.includes(g.id) && <Check size={12} className="text-white" />}
                    </div>
                    {g.label}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 3 — Taille équipe */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-3">
                {TEAM_SIZES.map((ts) => (
                  <button
                    key={ts.id}
                    onClick={() => setTeamSize(ts.id)}
                    className={`p-4 rounded-xl border text-sm font-medium transition-all min-h-[64px] ${
                      teamSize === ts.id
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {ts.label}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 4 — Entreprise */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Mon Entreprise SAS"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Site web (optionnel)</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://monentreprise.fr"
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Ces informations permettent à vos agents de produire des contenus personnalisés à votre marque.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 gap-3">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:text-white text-sm font-medium transition-colors min-h-[44px]"
                >
                  <ArrowLeft size={15} /> Retour
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] ${
                  canProceed()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white active:scale-95'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                }`}
              >
                {step === totalSteps - 1 ? (
                  <>Terminer & Recruter <Zap size={15} /></>
                ) : (
                  <>Continuer <ArrowRight size={15} /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
