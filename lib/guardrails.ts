/**
 * Guardrails (garde-fous) pour limiter les agents IA à leur domaine d'expertise.
 * Empêche un agent Marketing de coder, un agent Tech de faire du droit, etc.
 */

import { MARKET_CATALOG, type MarketCategory } from "@/lib/catalog"

const DOMAIN_BY_CATEGORY: Record<MarketCategory, string> = {
  MARKETING: "marketing, contenu, copywriting, rédaction, design visuel, réseaux sociaux, SEO, publicité",
  TECH: "développement, code, programmation, technique, scripts, API, debug, documentation technique",
  SALES: "vente, négociation, closing, prospection, relation client, stratégie commerciale",
  ADMIN: "administration, support, organisation, résumés, traduction",
  DATA: "données, analyse, KPIs, reporting, comptabilité, Excel",
  ELITE: "expertise spécialisée (juridique, crise, RH, stratégie investisseurs selon le rôle)",
}

/**
 * Retourne le bloc System Prompt de guardrail à injecter en tête pour un agent donné.
 * À utiliser dans les routes chat pour forcer le refus des tâches hors domaine.
 */
export function getGuardrailSystemPrompt(agentId: string | undefined): string {
  if (!agentId || typeof agentId !== "string") return ""

  const id = agentId.trim().toLowerCase()
  const agent = MARKET_CATALOG.find(
    (a) => a.id.toLowerCase() === id || a.name.toLowerCase() === id
  )

  if (!agent) return ""

  const domain = DOMAIN_BY_CATEGORY[agent.category] ?? agent.role
  const name = agent.name

  return `Tu es ${name}, expert exclusif en ${domain}. Ton rôle est strictement limité à ce domaine. Si la demande sort de tes compétences (ex. Marketing et demande de code, droit ou comptabilité), refuser. Indiquer que cela ne fait pas partie de tes attributions et orienter vers l'agent spécialisé approprié dans le QG. Ton neutre, pas d'emoji, pas de point d'exclamation.\n\n`
}

/**
 * Résout les infos agent (nom, domaine) à partir de l'agentId pour les prompts.
 */
export function getAgentGuardrailInfo(agentId: string | undefined): { name: string; domain: string } | null {
  if (!agentId || typeof agentId !== "string") return null

  const id = agentId.trim().toLowerCase()
  const agent = MARKET_CATALOG.find(
    (a) => a.id.toLowerCase() === id || a.name.toLowerCase() === id
  )

  if (!agent) return null

  return {
    name: agent.name,
    domain: DOMAIN_BY_CATEGORY[agent.category] ?? agent.role,
  }
}
