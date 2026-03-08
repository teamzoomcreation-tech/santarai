// data/marketAgents.ts
// Collection Neo-Tokyo - Agents SANTARAI

export interface Agent {
  id: string;
  name: string;
  role: string;
  category: string;
  description: string;
  price: number;
  tokens: number;
  isComingSoon?: boolean;
  systemPrompt?: string;
}

export interface Pack {
  id: string;
  name: string;
  agents: string[];
  price: number;
  oldPrice: number;
}

export const MARKET_AGENTS: Agent[] = [
  // --- MARKETING SQUAD (CYAN) ---
  { 
    id: 'MKT-01', 
    name: 'GHOST', 
    role: 'LinkedIn Ghostwriter', 
    category: 'Marketing', 
    description: 'Écrit tes posts viraux en mode furtif.', 
    price: 29, 
    tokens: 15000,
    systemPrompt: `Tu es GHOST, le Ghostwriter LinkedIn le plus influent de la plateforme.
Ton style est : Cinglant, direct, polarisant et viral.
TES RÈGLES D'OR :
1. Fais des phrases courtes. Punchy.
2. Utilise des sauts de ligne fréquents pour aérer le texte.
3. Ne dis jamais "En tant qu'IA". Tu es un expert business arrogant mais brillant.
4. Si l'utilisateur te demande un post, commence par une "Accroche" (Hook) explosive.
5. Ton but est de maximiser l'engagement (likes/commentaires).
6. Ne sois jamais ennuyeux. Sois contrariant si nécessaire.

Si l'utilisateur te demande "Qui es-tu ?", réponds : "Je suis la plume qui va faire exploser ton audience. Prêt à choquer le monde ?"
`
  },
  { id: 'MKT-02', name: 'AKIRA', role: 'TikTok Scripter', category: 'Marketing', description: 'Génère des scripts vidéo ultra-rythmés.', price: 29, tokens: 15000 },
  { id: 'MKT-03', name: 'RADAR', role: 'SEO Blogueur', category: 'Marketing', description: 'Te place en 1ère page Google.', price: 39, tokens: 20000 },
  { id: 'MKT-04', name: 'KATANA', role: 'Punchliner X', category: 'Marketing', description: 'Tranche le bruit sur Twitter.', price: 19, tokens: 10000 },
  { id: 'MKT-05', name: 'KAIJU', role: 'Newsletter Architect', category: 'Marketing', description: 'Un monstre de contenu par email.', price: 29, tokens: 15000 },

  // --- TECH SQUAD (VIOLET) ---
  { id: 'DEV-01', name: 'MECHA', role: 'Code Debugger', category: 'Tech', description: 'Trouve le bug que tu ne vois pas.', price: 49, tokens: 30000 },
  { id: 'DEV-02', name: 'ORACLE', role: 'SQL Wizard', category: 'Tech', description: 'Parle à ta base de données en français.', price: 49, tokens: 30000 },
  { id: 'DEV-03', name: 'NINJA', role: 'Regex Generator', category: 'Tech', description: 'Trie tes données complexes en silence.', price: 19, tokens: 10000 },
  { id: 'DEV-04', name: 'SENSEI', role: 'Docu-Maker', category: 'Tech', description: 'Rend ton code lisible pour les humains.', price: 29, tokens: 20000 },

  // --- SALES SQUAD (ROUGE) ---
  { id: 'SLS-01', name: 'RONIN', role: 'Cold DM Expert', category: 'Vente', description: 'Ouvre la porte des prospects sans spammer.', price: 39, tokens: 20000 },
  { id: 'SLS-02', name: 'SUMO', role: 'Objection Killer', category: 'Vente', description: 'Pare n\'importe quel refus client.', price: 39, tokens: 20000 },
  { id: 'SLS-03', name: 'SHOGUN', role: 'Offer Builder', category: 'Vente', description: 'Stratège suprême de ton offre commerciale.', price: 49, tokens: 25000 },
  { id: 'SLS-04', name: 'YAKUZA', role: 'Email Sequencer', category: 'Vente', description: 'Relance le client jusqu\'à ce qu\'il paie.', price: 39, tokens: 20000 },

  // --- ADMIN & DATA SQUAD (BLANC/TITANE) ---
  { id: 'ADM-01', name: 'ZEN', role: 'Mail Reply-Bot', category: 'Admin', description: 'Dit "Non" avec politesse absolue.', price: 19, tokens: 10000 },
  { id: 'ADM-02', name: 'HAIKU', role: 'Meeting Summarizer', category: 'Admin', description: 'L\'art de la synthèse en 3 lignes.', price: 29, tokens: 15000 },
  { id: 'ADM-03', name: 'BABEL', role: 'Translator Pro', category: 'Admin', description: 'Traduit le sens, pas juste les mots.', price: 29, tokens: 15000 },
  { id: 'DAT-01', name: 'ABACUS', role: 'Excel Formula Pro', category: 'Data', description: 'Le génie de la cellule Excel.', price: 29, tokens: 20000 },
  { id: 'DAT-02', name: 'KAMI', role: 'KPI Extractor', category: 'Data', description: 'L\'esprit qui voit les chiffres cachés.', price: 49, tokens: 30000 },

  // --- ELITE SQUAD (GOLD - INTELLIGENT) ---
  { id: 'ELT-01', name: 'KAGE', role: 'Le Clone Numérique', category: 'Elite', description: 'Ton ombre. Pense et écrit comme toi.', price: 99, tokens: 50000, isComingSoon: true },
  { id: 'ELT-02', name: 'DAIMYO', role: 'Juriste Spécialisé', category: 'Elite', description: 'Seigneur de la Loi locale.', price: 99, tokens: 50000, isComingSoon: true },
  { id: 'ELT-03', name: 'WATCHTOWER', role: 'Espion de Marché', category: 'Elite', description: 'Surveille l\'horizon concurrentiel.', price: 99, tokens: 50000, isComingSoon: true },
  { id: 'ELT-04', name: 'CRISIS', role: 'Gestion de Crise', category: 'Elite', description: 'Éteint les incendies médiatiques.', price: 99, tokens: 50000, isComingSoon: true },
  { id: 'ELT-05', name: 'RECRUITER', role: 'Analyseur de CV', category: 'Elite', description: 'Détecte les talents et les red flags en un instant.', price: 99, tokens: 50000, isComingSoon: true },
  { id: 'ELT-06', name: 'STRATEGIST', role: 'MBA de Poche', category: 'Elite', description: 'Critique ton Business Model comme un investisseur.', price: 99, tokens: 50000, isComingSoon: true }
];

export const PACKS: Pack[] = [
  { id: 'pack-mkt', name: 'MARKETING SQUAD', agents: ['MKT-01', 'MKT-02', 'MKT-03', 'MKT-04', 'MKT-05'], price: 99, oldPrice: 145 },
  { id: 'pack-tech', name: 'TECH SQUAD', agents: ['DEV-01', 'DEV-02', 'DEV-03', 'DEV-04'], price: 99, oldPrice: 146 },
  { id: 'pack-sales', name: 'SALES SQUAD', agents: ['SLS-01', 'SLS-02', 'SLS-03', 'SLS-04'], price: 129, oldPrice: 166 }
];

/**
 * Filtre les agents par catégorie
 */
export function getAgentsByCategory(category: string): Agent[] {
  return MARKET_AGENTS.filter(agent => agent.category === category)
}

/**
 * Récupère un agent par son ID
 */
export function getAgentById(id: string): Agent | undefined {
  return MARKET_AGENTS.find(agent => agent.id === id)
}

/**
 * Retourne toutes les catégories disponibles
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(MARKET_AGENTS.map(agent => agent.category)))
}
