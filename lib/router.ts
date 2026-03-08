/**
 * Orchestrateur (Smart Router) : détecte le meilleur agent pour une tâche
 * à partir du texte saisi par l'utilisateur.
 */

import type { Agent } from '@/lib/store'
import { MARKET_CATALOG } from '@/lib/catalog'

export interface RoutingResult {
  agentId: string
  agentName: string
  isOwned: boolean
}

/** Mapping mots-clés -> liste d'agent IDs (ordre de préférence) */
const KEYWORD_TO_AGENT_IDS: { keywords: string[]; agentIds: string[] }[] = [
  { keywords: ['image', 'logo', 'design', 'visuel', 'mockup', 'maquette'], agentIds: ['pixel'] },
  { keywords: ['code', 'bug', 'api', 'script', 'debug', 'automatisation'], agentIds: ['python_v1', 'mecha'] },
  { keywords: ['vente', 'mail', 'closing', 'client', 'prospect', 'négociation', 'relance'], agentIds: ['viper', 'yakuza', 'ronin'] },
  { keywords: ['stratégie', 'strategie', 'plan', 'business', 'modèle', 'pitch'], agentIds: ['shogun', 'strategist'] },
  { keywords: ['texte', 'post', 'linkedin', 'article', 'rédaction', 'thread', 'twitter'], agentIds: ['ghost', 'katana'] },
  { keywords: ['juridique', 'contrat', 'loi', 'legal', 'droit'], agentIds: ['daimyo'] },
  { keywords: ['analyse', 'data', 'kpi', 'métrique', 'dashboard', 'reporting'], agentIds: ['kami', 'data_hawk'] },
]

/** Noms d'affichage pour les agents (y compris ceux hors catalogue) */
function getAgentDisplayName(agentId: string): string {
  const found = MARKET_CATALOG.find((a) => a.id === agentId)
  return found ? found.name : agentId.toUpperCase().replace(/_/g, ' ')
}

/**
 * Trouve le meilleur agent pour la tâche décrite par la requête.
 * Retourne l'ID de l'agent idéal, son nom d'affichage et si l'utilisateur le possède.
 */
export function findBestAgentForTask(
  query: string,
  availableAgents: Agent[]
): RoutingResult {
  const q = query.trim().toLowerCase()
  if (!q) {
    const defaultId = 'ghost'
    const isOwned = availableAgents.some((a) => a.id === defaultId)
    return {
      agentId: defaultId,
      agentName: getAgentDisplayName(defaultId),
      isOwned,
    }
  }

  const ownedIds = new Set(availableAgents.map((a) => a.id))

  for (const { keywords, agentIds } of KEYWORD_TO_AGENT_IDS) {
    const hasMatch = keywords.some((kw) => q.includes(kw))
    if (!hasMatch) continue

    const firstOwned = agentIds.find((id) => ownedIds.has(id))
    const chosenId = firstOwned ?? agentIds[0]
    return {
      agentId: chosenId,
      agentName: getAgentDisplayName(chosenId),
      isOwned: ownedIds.has(chosenId),
    }
  }

  const defaultId = 'ghost'
  return {
    agentId: defaultId,
    agentName: getAgentDisplayName(defaultId),
    isOwned: ownedIds.has(defaultId),
  }
}
