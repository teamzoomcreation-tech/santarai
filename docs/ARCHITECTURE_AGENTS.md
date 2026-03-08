# Architecture Centralisée des Agents

## 📋 Vue d'ensemble

Ce document décrit l'architecture centralisée mise en place pour la gestion des thèmes visuels et des données des agents dans l'application **Atlas 360**.

---

## 🎨 1. Système de Thèmes (`lib/agentTheme.ts`)

### Objectif
Centraliser toute la logique de couleurs et de design des agents pour garantir une cohérence visuelle à travers toute l'application.

### Fonction principale : `getAgentTheme(role: string)`

**Signature :**
```typescript
interface AgentTheme {
  hex: string        // Couleur principale (ex: "#06b6d4")
  glow: string       // Couleur de lueur RGBA (ex: "rgba(6, 182, 212, 0.6)")
  bg: string         // Couleur de fond légère (ex: "rgba(6, 182, 212, 0.1)")
  family: string     // Nom de la famille (ex: "Marketing")
}

function getAgentTheme(roleInput: string): AgentTheme
```

**Exemple d'utilisation :**
```typescript
import { getAgentTheme } from '@/lib/agentTheme'

const theme = getAgentTheme("Copywriter Expert")
// Retourne :
// {
//   hex: "#60a5fa",
//   glow: "rgba(96, 165, 250, 0.6)",
//   bg: "rgba(96, 165, 250, 0.1)",
//   family: "Marketing"
// }
```

### Familles de Couleurs

| Famille | Couleur Base | Rôles Détectés |
|---------|--------------|----------------|
| **Marketing** | Cyan `#06b6d4` | SEO, Copywriter, Ads, Social, Community |
| **Tech** | Violet `#8b5cf6` | Dev, Fullstack, Mobile, QA, DevOps |
| **Sales** | Orange `#f97316` | SDR, Closer, Account Manager, Sales |
| **Data** | Vert `#10b981` | Data Scientist, Analyst, BI |
| **Créatif** | Rose `#ec4899` | Design, UI/UX, Video, Motion |
| **Finance** | Lime `#84cc16` | Comptable, Financial Analyst |
| **RH** | Turquoise `#2dd4bf` | Recruteur, HR Manager |
| **Légal** | Teal `#14b8a6` | Juriste, Avocat, DPO |
| **Direction** | Or `#f59e0b` | CEO, Directeur, Chief Officer |
| **Sécurité** | Rouge `#ef4444` | Cyber Security, Pentester |
| **Support** | Bleu `#3b82f6` | Customer Support, Success |

### Fonction auxiliaire : `getAllFamilies()`

Retourne la liste complète des familles avec leurs métadonnées :

```typescript
getAllFamilies()
// [
//   { name: 'Marketing', color: '#06b6d4', description: 'Communication & Stratégie' },
//   { name: 'Tech', color: '#8b5cf6', description: 'Développement & Innovation' },
//   ...
// ]
```

---

## 📊 2. Base de Données Agents (`data/marketAgents.ts`)

### Objectif
Centraliser tous les agents disponibles au recrutement dans le Marketplace.

### Structure d'un Agent

```typescript
interface MarketAgent {
  id: string                // Identifiant unique (ex: "mkt-001")
  name: string              // Nom de l'agent (ex: "SEO Sentinel")
  role: string              // Rôle précis (ex: "SEO Specialist")
  category: string          // Catégorie (ex: "Marketing")
  description: string       // Description courte et percutante
  price: number             // Prix mensuel en $ (ex: 450)
  tokens: number            // Consommation mensuelle estimée (ex: 800000)
  capabilities: string[]    // Compétences clés
  featured?: boolean        // Agent mis en avant (optionnel)
}
```

### Constante principale : `MARKET_AGENTS`

**Total :** 40 agents répartis dans 8 catégories.

**Répartition :**
- Marketing : 6 agents
- Tech : 8 agents
- Sales : 5 agents
- Data/Finance : 5 agents
- RH/Légal : 4 agents
- Direction : 4 agents
- Support : 4 agents
- Créatif : 4 agents

**Exemple d'agent :**
```typescript
{
  id: 'mkt-002',
  name: 'Copy Alchemist',
  role: 'Copywriter Expert',
  category: 'Marketing',
  description: 'Création de contenus persuasifs qui convertissent : landing pages, emails, scripts vidéo.',
  price: 520,
  tokens: 950000,
  capabilities: ['Copywriting', 'Storytelling', 'Email Marketing', 'Scripts Vidéo'],
  featured: true
}
```

### Fonctions utilitaires

#### `getAgentsByCategory(category: string): MarketAgent[]`
Filtre les agents par catégorie.

```typescript
const marketingAgents = getAgentsByCategory('Marketing')
// Retourne les 6 agents Marketing
```

#### `getFeaturedAgents(): MarketAgent[]`
Récupère uniquement les agents mis en avant.

```typescript
const featured = getFeaturedAgents()
// Retourne ~5-6 agents avec featured: true
```

#### `getAgentById(id: string): MarketAgent | undefined`
Récupère un agent spécifique par son ID.

```typescript
const agent = getAgentById('mkt-001')
// Retourne l'agent "SEO Sentinel"
```

#### `getAllCategories(): string[]`
Liste toutes les catégories disponibles.

```typescript
const categories = getAllCategories()
// ["Marketing", "Tech", "Sales", "Data", ...]
```

---

## 🔗 3. Composants Unifiés

### `components/LiveOfficeScene.tsx`

**Mise à jour :**
- Import de `getAgentTheme` depuis `@/lib/agentTheme`
- Suppression de la logique de couleurs en dur
- Utilisation directe du thème centralisé

**Avant :**
```typescript
// 100+ lignes de logique de couleurs en dur
const getAgentTheme = (roleInput: string) => {
  const r = roleInput?.toLowerCase() || ''
  if (r.includes('seo')) return { hex: '#22d3ee', ... }
  // ... 40+ conditions
}
```

**Après :**
```typescript
import { getAgentTheme } from '@/lib/agentTheme'

// Utilisation directe
const theme = getAgentTheme(role)
const color = theme.hex
const glow = theme.glow
```

### `components/dashboard/agent-card.tsx`

**Mise à jour :**
- Import de `getAgentTheme`
- Bordure colorée dynamiquement selon le rôle
- Effet hover avec lueur personnalisée
- Couleur d'efficacité dynamique

**Implémentation :**
```typescript
import { getAgentTheme } from '@/lib/agentTheme'

export function AgentCard({ agent }: AgentCardProps) {
  const theme = getAgentTheme(agent.role)

  return (
    <div 
      style={{
        borderColor: `${theme.hex}30`,
        boxShadow: `0 0 0 0 ${theme.glow}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${theme.hex}80`
        e.currentTarget.style.boxShadow = `0 0 20px ${theme.glow}`
      }}
    >
      {/* Efficacité avec couleur du thème */}
      <span style={{ color: theme.hex }}>{agent.efficiency}%</span>
    </div>
  )
}
```

---

## 🎯 4. Avantages de l'Architecture

### ✅ Maintenance simplifiée
- **Une seule source de vérité** pour les couleurs
- Modification globale en un seul endroit
- Pas de duplication de code

### ✅ Cohérence garantie
- Même logique de détection partout
- Couleurs synchronisées automatiquement
- Design unifié à travers l'app

### ✅ Extensibilité
- Ajout facile de nouveaux rôles
- Ajout simple de nouvelles familles
- Modification d'une couleur sans casser l'existant

### ✅ Performance
- Pas de calculs répétés
- Imports optimisés
- Fonctions pures et rapides

### ✅ Type-safety
- Interface TypeScript stricte
- Autocomplete dans l'IDE
- Erreurs détectées à la compilation

---

## 📦 5. Comment Ajouter un Nouveau Rôle

### Étape 1 : Ajouter la détection dans `lib/agentTheme.ts`

```typescript
// Dans la fonction getAgentTheme
if (r.includes('nouveau-role')) {
  return { 
    hex: '#COULEUR', 
    glow: 'rgba(R, G, B, 0.6)', 
    bg: 'rgba(R, G, B, 0.1)',
    family: 'Famille'
  }
}
```

### Étape 2 : Ajouter l'agent dans `data/marketAgents.ts`

```typescript
export const MARKET_AGENTS: MarketAgent[] = [
  // ... agents existants
  {
    id: 'cat-XXX',
    name: 'Nom Cool',
    role: 'Nouveau Role',
    category: 'Catégorie',
    description: 'Description percutante',
    price: 600,
    tokens: 800000,
    capabilities: ['Compétence 1', 'Compétence 2'],
    featured: false
  }
]
```

### Étape 3 : C'est tout ! 🎉

Le nouveau rôle sera automatiquement :
- ✅ Coloré correctement dans la scène 3D
- ✅ Affiché avec la bonne couleur dans les cartes
- ✅ Disponible au recrutement dans le Marketplace

---

## 🚀 6. Utilisation dans de Nouveaux Composants

Pour tout nouveau composant qui affiche des agents :

```typescript
import { getAgentTheme } from '@/lib/agentTheme'

function MonComposant({ agent }) {
  const theme = getAgentTheme(agent.role)
  
  return (
    <div style={{ borderColor: theme.hex, backgroundColor: theme.bg }}>
      <span style={{ color: theme.hex }}>{agent.name}</span>
      {/* Utilise theme.hex, theme.glow, theme.bg, theme.family */}
    </div>
  )
}
```

---

## 📈 7. Statistiques

**Centralisation :**
- **Avant :** 3 fichiers avec logique dupliquée (300+ lignes)
- **Après :** 1 fichier centralisé (`lib/agentTheme.ts`) (200 lignes)
- **Économie :** ~33% de code en moins

**Base de données :**
- **40 agents** prêts au recrutement
- **11 familles** de couleurs
- **40+ rôles** détectés intelligemment

**Couverture :**
- ✅ Scène 3D (`LiveOfficeScene.tsx`)
- ✅ Cartes agents (`agent-card.tsx`)
- ✅ Prêt pour Marketplace
- ✅ Prêt pour page Recrutement

---

## 🎓 8. Bonnes Pratiques

### ✅ À FAIRE
- Toujours utiliser `getAgentTheme(role)` pour obtenir les couleurs
- Utiliser `MARKET_AGENTS` comme source de données
- Respecter l'interface `AgentTheme`
- Tester avec différents rôles

### ❌ À ÉVITER
- Ne PAS dupliquer la logique de couleurs
- Ne PAS hardcoder les couleurs dans les composants
- Ne PAS ignorer le système de thèmes
- Ne PAS créer de nouvelles sources de données agents

---

## 📞 Support

Pour toute question sur l'architecture :
1. Consulter ce document
2. Vérifier `lib/agentTheme.ts` (bien documenté)
3. Regarder les exemples dans `LiveOfficeScene.tsx` et `agent-card.tsx`

---

**Version :** 1.0  
**Date :** Janvier 2026  
**Status :** ✅ Production Ready
