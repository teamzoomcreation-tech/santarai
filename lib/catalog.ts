/**
 * Catalogue partagé des agents (Recrutement + Dashboard + Orchestrateur).
 * Roster aligné MASTERFILE §3 : 28 salariés (GHOST → STRATEGIST + RECRUITER).
 * Prix monthlyCost = Prix (TK) du Masterfile.
 */

export type MarketCategory = 'MARKETING' | 'TECH' | 'SALES' | 'ADMIN' | 'DATA' | 'ELITE'

export interface MarketAgent {
  id: string
  name: string
  category: MarketCategory
  role: string
  monthlyCost: number
  description: string
  avatar: string
}

export const MARKET_CATALOG: MarketAgent[] = [
  // --- MARKETING (Violet) ---
  { id: 'ghost', name: 'GHOST', category: 'MARKETING', role: 'Ghostwriter', monthlyCost: 5000, description: 'Expert LinkedIn invisible. Écrit sans être vu.', avatar: 'G' },
  { id: 'akira', name: 'AKIRA', category: 'MARKETING', role: 'Video Scripter', monthlyCost: 4500, description: 'Scripts vidéo rapides et explosifs (TikTok).', avatar: 'A' },
  { id: 'radar', name: 'RADAR', category: 'MARKETING', role: 'SEO Master', monthlyCost: 4000, description: 'Détecte les opportunités et te place n°1.', avatar: 'R' },
  { id: 'katana', name: 'KATANA', category: 'MARKETING', role: 'Punchliner', monthlyCost: 4000, description: 'Sniping Twitter. Des phrases qui tranchent.', avatar: 'K' },
  { id: 'kaiju', name: 'KAIJU', category: 'MARKETING', role: 'Newsletter', monthlyCost: 4500, description: 'Un monstre de contenu qui prend toute la place.', avatar: 'K' },
  { id: 'pixel', name: 'PIXEL', category: 'MARKETING', role: 'Designer', monthlyCost: 4000, description: 'Image, logo, design visuel. Créations qui marquent.', avatar: 'P' },
  // --- TECH (Bleu) ---
  { id: 'mecha', name: 'MECHA', category: 'TECH', role: 'Debugger', monthlyCost: 4000, description: 'Machine de guerre qui répare les erreurs.', avatar: 'M' },
  { id: 'oracle', name: 'ORACLE', category: 'TECH', role: 'SQL Wizard', monthlyCost: 6000, description: 'Source de vérité. Parle à la Data.', avatar: 'O' },
  { id: 'ninja', name: 'NINJA', category: 'TECH', role: 'Backend', monthlyCost: 5000, description: "Regex Generator. Trie les données à la vitesse de l'éclair.", avatar: 'N' },
  { id: 'sensei', name: 'SENSEI', category: 'TECH', role: 'Tech Doc', monthlyCost: 3500, description: 'Celui qui enseigne et rend le code clair.', avatar: 'S' },
  { id: 'python_v1', name: 'PYTHON V1', category: 'TECH', role: 'Scripter', monthlyCost: 2500, description: 'Automatisation de scripts et API.', avatar: 'P' },
  // --- VENTE (Vert) ---
  { id: 'ronin', name: 'RONIN', category: 'SALES', role: 'Hunter', monthlyCost: 3500, description: 'Samouraï solitaire qui chasse les prospects.', avatar: 'R' },
  { id: 'viper', name: 'VIPER', category: 'SALES', role: 'Negotiator', monthlyCost: 3500, description: 'Closing agressif et négociation rapide.', avatar: 'V' },
  { id: 'sumo', name: 'SUMO', category: 'SALES', role: 'Closer', monthlyCost: 4000, description: 'Objection Killer. Inamovible face aux refus.', avatar: 'S' },
  { id: 'shogun', name: 'SHOGUN', category: 'SALES', role: 'Strategist', monthlyCost: 5500, description: "Général qui définit la stratégie de l'offre.", avatar: 'S' },
  { id: 'yakuza', name: 'YAKUZA', category: 'SALES', role: 'Retention', monthlyCost: 5000, description: 'Email Sequencer. Ne lâche jamais le client.', avatar: 'Y' },
  // --- ADMIN (Gris) ---
  { id: 'zen', name: 'ZEN', category: 'ADMIN', role: 'Support', monthlyCost: 2000, description: 'Reste calme et poli face au chaos des emails.', avatar: 'Z' },
  { id: 'haiku', name: 'HAIKU', category: 'ADMIN', role: 'Summarizer', monthlyCost: 2500, description: 'Résume 1h de blabla en 3 lignes.', avatar: 'H' },
  { id: 'babel', name: 'BABEL', category: 'ADMIN', role: 'Translator', monthlyCost: 3000, description: 'Brise la barrière de la langue.', avatar: 'B' },
  // --- DATA (Cyan) ---
  { id: 'abacus', name: 'ABACUS', category: 'DATA', role: 'Accounting', monthlyCost: 3000, description: 'Excel Pro. Le boulier millénaire.', avatar: 'A' },
  { id: 'kami', name: 'KAMI', category: 'DATA', role: 'Analyst', monthlyCost: 7000, description: "KPI Extractor. L'esprit supérieur.", avatar: 'K' },
  { id: 'data_hawk', name: 'DATA HAWK', category: 'DATA', role: 'Miner', monthlyCost: 6000, description: 'Extraction de données brutes.', avatar: 'D' },
  // --- ELITE (Or / Gold) ---
  { id: 'kage', name: 'KAGE', category: 'ELITE', role: 'Clone', monthlyCost: 10000, description: "Ton ombre. Agit comme toi quand tu n'es pas là.", avatar: 'K' },
  { id: 'daimyo', name: 'DAIMYO', category: 'ELITE', role: 'Legal', monthlyCost: 9000, description: 'Seigneur féodal qui connaît la Loi.', avatar: 'D' },
  { id: 'watchtower', name: 'WATCHTOWER', category: 'ELITE', role: 'Spy', monthlyCost: 8500, description: 'Tour de garde qui surveille le marché.', avatar: 'W' },
  { id: 'crisis', name: 'CRISIS', category: 'ELITE', role: 'Crisis Mgmt', monthlyCost: 12000, description: "Plan d'action immédiat pour éteindre le feu.", avatar: 'C' },
  { id: 'recruiter', name: 'RECRUITER', category: 'ELITE', role: 'HR Expert', monthlyCost: 5000, description: 'Détecte les talents et les red flags.', avatar: 'R' },
  { id: 'strategist', name: 'STRATEGIST', category: 'ELITE', role: 'VC Advisor', monthlyCost: 15000, description: 'Critique business model niveau investisseur.', avatar: 'S' },
]
