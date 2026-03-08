/**
 * Personnalités et Quick Actions par agent pour le Chat contextuel.
 * Chaque agent a un greeting et des actions suggérées.
 */

export interface AgentPersonality {
  greeting: string
  actions: string[]
}

export const AGENT_DATA: Record<string, AgentPersonality> = {
  // --- MARKETING ---
  ghost: {
    greeting:
      "Mode furtif activé. Quel sujet on couvre aujourd'hui sans laisser de trace ?",
    actions: ['Post LinkedIn Viral', 'Thread Twitter', 'Réécriture Polémique'],
  },
  radar: {
    greeting:
      'Mes scanners tournent à plein régime. Quelle tendance on intercepte ?',
    actions: ['Audit SEO', 'Analyse concurrents', 'Mots-clés High Volume'],
  },
  kaiju: {
    greeting: "J'ai faim de contenu. On lance la grosse artillerie ?",
    actions: ['Newsletter Massive', 'Campagne Mailing', 'Livre Blanc'],
  },

  // --- TECH ---
  python_v1: {
    greeting: 'Console prête. En attente d\'input. 🐍',
    actions: ['Script Automatisation', 'Fix API Error', 'Data Scraping'],
  },
  mecha: {
    greeting: 'Systèmes nominaux. Où est le bug ?',
    actions: ['Debug Log', 'Optimisation Code', 'Refactoring'],
  },

  // --- SALES ---
  yakuza: {
    greeting:
      "La famille d'abord. Mais le business avant tout. Qui ne veut pas payer ?",
    actions: ['Séquence de Relance', 'Closing Agressif', 'Négociation'],
  },
  sumo: {
    greeting: 'Je suis en position. Rien ne passe.',
    actions: ['Gestion Objection', 'Défense Prix', 'Lock Deal'],
  },

  // --- ELITE ---
  crisis: {
    greeting:
      '⚠️ SALLE DE CRISE ACTIVÉE. Quel est le niveau d\'alerte ?',
    actions: [
      'Plan Communication Urgence',
      'Statement Officiel',
      'Analyse Dégâts',
    ],
  },
  strategist: {
    greeting:
      "J'ai analysé vos métriques. Votre modèle a des failles. On regarde ?",
    actions: ['Audit Business Model', 'Pitch Deck Review', 'Pivot Strategy'],
  },

  // Fallback pour les autres agents
  default: {
    greeting: 'Unité en ligne. Prêt pour instructions.',
    actions: ['Analyse', 'Synthèse', 'Recherche'],
  },
}

/** IDs des agents de catégorie ELITE (bordure dorée dans le chat) */
export const ELITE_AGENT_IDS = new Set([
  'kage',
  'daimyo',
  'watchtower',
  'crisis',
  'recruiter',
  'strategist',
])

export function getAgentPersonality(agentId: string | undefined): AgentPersonality {
  if (!agentId) return AGENT_DATA.default
  const lower = agentId.toLowerCase()
  return AGENT_DATA[lower] ?? AGENT_DATA.default
}

export function isEliteAgent(agentId: string | undefined): boolean {
  if (!agentId) return false
  return ELITE_AGENT_IDS.has(agentId.toLowerCase())
}
