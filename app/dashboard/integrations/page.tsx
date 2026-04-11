'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Slack, Mail, Calendar, Linkedin, Globe, Webhook,
  CheckCircle2, Clock, Lock, ExternalLink, Zap
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: typeof Slack
  status: 'connected' | 'available' | 'coming_soon'
  category: string
  color: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Recevez les outputs de vos agents directement dans vos canaux.',
    icon: Slack,
    status: 'coming_soon',
    category: 'Communication',
    color: 'text-purple-400',
  },
  {
    id: 'gmail',
    name: 'Gmail / Outlook',
    description: 'Vos agents rédigent et envoient des emails en votre nom.',
    icon: Mail,
    status: 'coming_soon',
    category: 'Communication',
    color: 'text-red-400',
  },
  {
    id: 'gcalendar',
    name: 'Google Calendar',
    description: 'Planification automatique et gestion des événements.',
    icon: Calendar,
    status: 'coming_soon',
    category: 'Productivité',
    color: 'text-blue-400',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publication automatique de posts et gestion de votre profil.',
    icon: Linkedin,
    status: 'coming_soon',
    category: 'Réseaux sociaux',
    color: 'text-sky-400',
  },
  {
    id: 'zapier',
    name: 'Zapier / Make',
    description: 'Déclenchez des Zaps depuis les outputs de vos agents.',
    icon: Zap,
    status: 'available',
    category: 'Automatisation',
    color: 'text-orange-400',
  },
  {
    id: 'webhook',
    name: 'Webhook entrant',
    description: 'Déclenchez une mission SANTARAI depuis n\'importe quel outil externe.',
    icon: Webhook,
    status: 'available',
    category: 'Automatisation',
    color: 'text-cyan-400',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Vos agents écrivent directement dans vos pages Notion.',
    icon: Globe,
    status: 'coming_soon',
    category: 'Productivité',
    color: 'text-white',
  },
]

const categories = ['Tous', ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))]

const statusConfig = {
  connected: { label: 'Connecté', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  available: { label: 'Disponible', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: Zap },
  coming_soon: { label: 'Bientôt', color: 'bg-slate-700/50 text-slate-400 border-slate-600/30', icon: Clock },
}

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState('Tous')

  const filtered = INTEGRATIONS.filter(
    (i) => activeCategory === 'Tous' || i.category === activeCategory
  )

  const handleConnect = (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      toast.info(`${integration.name} arrive bientôt !`, {
        description: 'Nous travaillons sur cette intégration. Restez connecté.',
      })
      return
    }
    if (integration.status === 'available') {
      toast.success('Redirection vers la configuration…')
    }
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#020617] text-white pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
            <Zap size={13} className="text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 tracking-wide">INTÉGRATIONS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Connectez SANTARAI à vos outils</h1>
          <p className="text-slate-400 text-sm md:text-base">
            Branchez vos agents IA sur vos outils métier et automatisez encore plus.
          </p>
        </div>

        {/* Filtres catégories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[40px] ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille d'intégrations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((integration) => {
            const Icon = integration.icon
            const status = statusConfig[integration.status]
            const StatusIcon = status.icon
            return (
              <div
                key={integration.id}
                className="group rounded-2xl border border-white/5 bg-slate-900/40 p-5 hover:border-white/10 hover:bg-slate-900/60 transition-all flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center ${integration.color}`}>
                    <Icon size={22} />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${status.color}`}>
                    <StatusIcon size={10} />
                    {status.label}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">{integration.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{integration.description}</p>
                </div>

                <button
                  onClick={() => handleConnect(integration)}
                  disabled={integration.status === 'connected'}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                    integration.status === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : integration.status === 'coming_soon'
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
                  }`}
                >
                  {integration.status === 'connected' ? (
                    <><CheckCircle2 size={15} /> Connecté</>
                  ) : integration.status === 'coming_soon' ? (
                    <><Lock size={13} /> Bientôt disponible</>
                  ) : (
                    <><ExternalLink size={13} /> Configurer</>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Banner demande d'intégration */}
        <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center">
          <p className="text-sm text-slate-300 mb-3">
            Vous avez besoin d'une intégration spécifique ?
          </p>
          <button
            onClick={() => toast.info('Merci ! Nous prendrons en compte votre demande.')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors min-h-[44px]"
          >
            Soumettre une demande
          </button>
        </div>
      </div>
    </div>
  )
}
