// ============================================
// CERVEAU VISUEL DE L'APPLICATION
// Gestion centralisée des thèmes d'agents
// Basé sur les IDs Neo-Tokyo - SANTARAI
// ============================================

export interface AgentTheme {
  hex: string        // Couleur principale (hex)
  glow: string       // Couleur de lueur (rgba)
  bg: string         // Couleur de fond légère pour badges
  family: string     // Nom de la famille
  isElite?: boolean  // Indicateur Elite Squad
}

/**
 * Retourne le thème visuel complet d'un agent basé sur son ID (priorité) ou son rôle (fallback)
 * 
 * Signatures supportées :
 * - getAgentTheme(agent: { id: string, role?: string }) - Compatibilité avec appels existants
 * - getAgentTheme(agentId: string) - ID uniquement
 * - getAgentTheme(roleInput: string, agentId: string) - Rôle + ID
 * 
 * @param roleInputOrAgent - Le rôle de l'agent (string) ou l'agent complet (objet) ou l'ID (string)
 * @param agentId - L'ID de l'agent (string) - priorité absolue si fourni
 * @returns AgentTheme - Objet contenant toutes les couleurs et métadonnées
 */
export function getAgentTheme(
  roleInputOrAgent?: string | { id: string; role?: string },
  agentId?: string
): AgentTheme {
  let finalAgentId: string | undefined
  let finalRoleInput: string | undefined

  // Détecter le type du premier paramètre
  if (typeof roleInputOrAgent === 'object' && roleInputOrAgent !== null) {
    // Cas 1 : Objet agent passé en premier paramètre
    finalAgentId = roleInputOrAgent.id
    finalRoleInput = roleInputOrAgent.role
  } else if (typeof roleInputOrAgent === 'string') {
    // Cas 2 : String - peut être un ID ou un rôle
    if (roleInputOrAgent.match(/^(ELT|MKT|DEV|SLS|ADM|DAT)-/)) {
      // C'est un ID (format Neo-Tokyo)
      finalAgentId = roleInputOrAgent
    } else {
      // C'est probablement un rôle
      finalRoleInput = roleInputOrAgent
    }
  }

  // Si agentId est fourni explicitement en second paramètre, il a la priorité
  if (agentId) {
    finalAgentId = agentId
  }

  // PRIORITÉ 1 : Utiliser l'ID si disponible
  if (finalAgentId) {
    const prefix = finalAgentId.substring(0, 3).toUpperCase()

    // ==========================================
    // ELITE SQUAD (GOLD - INTELLIGENT)
    // ==========================================
    if (prefix === 'ELT') {
      return { 
        hex: '#fbbf24',           // Gold intense
        glow: 'rgba(251, 191, 36, 0.8)',  // Glow intense
        bg: 'rgba(251, 191, 36, 0.15)',
        family: 'Elite',
        isElite: true
      }
    }

    // ==========================================
    // MARKETING SQUAD (CYAN)
    // ==========================================
    if (prefix === 'MKT') {
      return { 
        hex: '#06b6d4',           // Cyan
        glow: 'rgba(6, 182, 212, 0.6)', 
        bg: 'rgba(6, 182, 212, 0.1)',
        family: 'Marketing'
      }
    }

    // ==========================================
    // TECH SQUAD (VIOLET)
    // ==========================================
    if (prefix === 'DEV') {
      return { 
        hex: '#8b5cf6',           // Violet
        glow: 'rgba(139, 92, 246, 0.6)', 
        bg: 'rgba(139, 92, 246, 0.1)',
        family: 'Tech'
      }
    }

    // ==========================================
    // SALES SQUAD (RED)
    // ==========================================
    if (prefix === 'SLS') {
      return { 
        hex: '#ef4444',           // Red
        glow: 'rgba(239, 68, 68, 0.6)', 
        bg: 'rgba(239, 68, 68, 0.1)',
        family: 'Vente'
      }
    }

    // ==========================================
    // OPS SQUAD (SLATE - ADMIN & DATA)
    // ==========================================
    if (prefix === 'ADM' || prefix === 'DAT') {
      return { 
        hex: '#e2e8f0',           // Slate (Blanc/Gris)
        glow: 'rgba(226, 232, 240, 0.5)', 
        bg: 'rgba(226, 232, 240, 0.1)',
        family: 'Ops'
      }
    }
  }

  // PRIORITÉ 2 : Fallback sur le rôle si pas d'ID ou ID non reconnu
  // (Pour compatibilité avec les anciens agents)
  const r = finalRoleInput?.toLowerCase() || ''

  // Recherche par mots-clés dans le rôle
  if (r.includes('elite') || r.includes('clone') || r.includes('juriste') || r.includes('espion') || r.includes('crise')) {
    return { 
      hex: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.8)',
      bg: 'rgba(251, 191, 36, 0.15)',
      family: 'Elite',
      isElite: true
    }
  }

  if (r.includes('marketing') || r.includes('linkedin') || r.includes('tiktok') || r.includes('seo') || r.includes('newsletter') || r.includes('twitter')) {
    return { 
      hex: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.6)', 
      bg: 'rgba(6, 182, 212, 0.1)',
      family: 'Marketing'
    }
  }

  if (r.includes('tech') || r.includes('dev') || r.includes('code') || r.includes('sql') || r.includes('regex') || r.includes('docu')) {
    return { 
      hex: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.6)', 
      bg: 'rgba(139, 92, 246, 0.1)',
      family: 'Tech'
    }
  }

  if (r.includes('vente') || r.includes('sales') || r.includes('dm') || r.includes('objection') || r.includes('offer') || r.includes('email')) {
    return { 
      hex: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.6)', 
      bg: 'rgba(239, 68, 68, 0.1)',
      family: 'Vente'
    }
  }

  if (r.includes('admin') || r.includes('data') || r.includes('excel') || r.includes('kpi') || r.includes('mail') || r.includes('meeting') || r.includes('translator')) {
    return { 
      hex: '#e2e8f0',
      glow: 'rgba(226, 232, 240, 0.5)', 
      bg: 'rgba(226, 232, 240, 0.1)',
      family: 'Ops'
    }
  }

  // ==========================================
  // DÉFAUT (Gris Slate) - Pour compatibilité
  // ==========================================
  return { 
    hex: '#64748b', 
    glow: 'rgba(100, 116, 139, 0.5)', 
    bg: 'rgba(100, 116, 139, 0.1)',
    family: 'Général'
  }
}

/**
 * Retourne toutes les familles disponibles avec leurs couleurs principales
 */
export function getAllFamilies() {
  return [
    { name: 'Elite', color: '#fbbf24', description: 'Agents Premium Intelligents' },
    { name: 'Marketing', color: '#06b6d4', description: 'Communication & Stratégie' },
    { name: 'Tech', color: '#8b5cf6', description: 'Développement & Innovation' },
    { name: 'Vente', color: '#ef4444', description: 'Commerce & Croissance' },
    { name: 'Ops', color: '#e2e8f0', description: 'Administration & Data' }
  ]
}
