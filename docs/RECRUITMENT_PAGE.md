# Page de Recrutement (Marketplace)

## 📋 Vue d'ensemble

La page **Centre de Recrutement** permet aux utilisateurs de parcourir, filtrer et recruter des agents IA parmi un catalogue de 40 agents spécialisés.

**Route :** `/dashboard/recruitment`

**Fichier :** `app/dashboard/recruitment/page.tsx`

---

## 🎨 Fonctionnalités

### 1. Système de Filtrage Multi-Niveaux

#### Filtrage par Catégorie (Onglets)
- **Dynamique :** Les catégories sont générées automatiquement depuis les données
- **11 catégories disponibles :** Tous, Marketing, Tech, Sales, Data, Finance, RH, Légal, Direction, Support, Créatif, Sécurité
- **UI :** Onglets horizontaux avec défilement sur mobile
- **Active State :** L'onglet actif est mis en surbrillance avec un fond blanc

#### Barre de Recherche
- **Recherche intelligente :** Filtre par nom, rôle OU compétence
- **Temps réel :** Les résultats se mettent à jour instantanément
- **Placeholder dynamique :** Suggère les types de recherche possibles

### 2. Grille d'Agents

#### Cartes Agent (Agent Cards)
Chaque carte affiche :
- **Avatar coloré :** Initiale de l'agent avec la couleur du rôle (via `getAgentTheme`)
- **Nom & Rôle :** Titre en gras + rôle en monospace coloré
- **Prix mensuel :** Badge discret avec le coût en $/mois
- **Description :** Texte court et percutant (3 lignes max, line-clamp)
- **Compétences :** Pills des 3 premières compétences + compteur si plus
- **Badge "TOP" :** Pour les agents featured (coin supérieur droit)
- **Bouton d'action :** "Recruter" ou "Recruté" (état désactivé si déjà recruté)

#### Effets Visuels
- **Hover animé :**
  - Translation vers le haut (`-translate-y-2`)
  - Bordure colorée qui s'intensifie
  - Ombre portée avec lueur de la couleur du rôle
  - Effet de lueur d'arrière-plan (blur-3xl)
  - Avatar qui pivote légèrement
- **Animations d'entrée :**
  - Fade-in progressif (delay basé sur l'index)
  - Slide depuis le bas (translateY)

### 3. Gestion du Recrutement

#### Processus de Recrutement
1. **Clic sur "Recruter"**
2. **Appel API :** `addAgent()` depuis le contexte
3. **Sauvegarde BDD :** Agent enregistré dans Supabase
4. **Toast de Succès :** Notification automatique (gérée par le contexte)
5. **Mise à jour UI :** Bouton devient "Recruté" (vert, désactivé)

#### Vérification de Doublon
- Avant chaque recrutement, vérifie si l'agent est déjà dans l'équipe
- Empêche le recrutement multiple du même agent

### 4. État Vide

Si aucun agent ne correspond aux filtres :
- **Icône de recherche agrandie**
- **Message clair :** "Aucun agent trouvé"
- **Suggestion :** "Essayez de modifier vos filtres ou votre recherche"

---

## 🎨 Design System

### Palette de Couleurs
- **Fond :** Gradient from `#020617` (bleu très sombre) to `#0a0f24`
- **Cartes :** `slate-900/40` avec backdrop-blur
- **Bordures :** Dynamiques selon le rôle de l'agent
- **Texte :** Blanc/slate-400 pour hiérarchie visuelle

### Typographie
- **Titre :** Gradient de blanc à bleu/violet
- **Rôles :** Monospace coloré (couleur du thème)
- **Description :** Slate-400, leading-relaxed

### Responsive
- **Mobile (< 768px) :** 1 colonne
- **Tablette (768-1024px) :** 2 colonnes
- **Desktop (1024-1280px) :** 3 colonnes
- **Large (> 1280px) :** 4 colonnes

---

## 🔧 Architecture Technique

### Imports Principaux

```typescript
import { MARKET_AGENTS, getAllCategories } from '@/data/marketAgents'
import { getAgentTheme } from '@/lib/agentTheme'
import { useAgents } from '@/contexts/agents-context'
import { toast } from 'sonner'
```

### États React

```typescript
const [selectedCategory, setSelectedCategory] = useState('Tous')
const [searchQuery, setSearchQuery] = useState('')
```

### Filtrage Logique

```typescript
const filteredAgents = useMemo(() => {
  return MARKET_AGENTS.filter(agent => {
    const matchesCategory = selectedCategory === 'Tous' || agent.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
                        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })
}, [selectedCategory, searchQuery])
```

### Fonction de Recrutement

```typescript
const handleRecruit = async (agent: any) => {
  try {
    await addAgent({
      name: agent.name,
      role: agent.role,
      status: 'idle',
      avatar: { color: getAgentTheme(agent.role).hex },
      tasksCompleted: 0,
      efficiency: 85,
    })
  } catch (error) {
    console.error('Erreur lors du recrutement:', error)
  }
}
```

---

## 🎯 Animations CSS

Toutes les animations sont définies dans `app/globals.css` :

### fadeInUp
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### fadeIn
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### fadeInScale
```css
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Utilisation :** Classes `.animate-fade-in-up`, `.animate-fade-in`, `.animate-fade-in-scale`

**Delays personnalisés :** Via `style={{ animationDelay: '100ms' }}`

---

## 🚀 Intégration dans le Dashboard

### Lien de Navigation

Pour ajouter un lien vers la page dans le sidebar :

```tsx
import { Users } from 'lucide-react'

<Link href="/dashboard/recruitment">
  <Button variant="ghost" className="w-full justify-start">
    <Users className="mr-2 h-4 w-4" />
    Recrutement
  </Button>
</Link>
```

### Breadcrumb

```tsx
<nav className="mb-4">
  <Link href="/dashboard">Dashboard</Link> / 
  <span>Recrutement</span>
</nav>
```

---

## 📊 Métriques Affichées

Dans le header :
- **Nombre d'agents disponibles** (filtré)
- **Nombre d'agents dans l'équipe**

Format : `{filteredAgents.length} agents disponibles • {myAgents.length} dans votre équipe`

---

## 🎨 Personnalisation

### Modifier les Couleurs de Fond

```typescript
// Ligne 12
className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f24] to-[#020617]"
```

### Changer le Nombre de Colonnes

```typescript
// Ligne 112
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
```

### Modifier le Délai d'Animation

```typescript
// Ligne 118
style={{ animationDelay: `${index * 20}ms` }}
// Réduire à 10ms pour plus rapide, augmenter à 30ms pour plus lent
```

---

## 🐛 Gestion des Erreurs

### Erreurs Capturées

1. **Agent déjà recruté :** Détection via `isAgentHired(agent.id)`
2. **Erreur de réseau :** Try/catch autour de `addAgent()`
3. **Utilisateur non connecté :** Gérée dans le contexte `useAgents`

### Messages d'Erreur

Les toasts sont gérés automatiquement par `contexts/agents-context.tsx` :
- ✅ Succès : "Agent recruté avec succès !"
- ❌ Erreur : "Erreur lors du recrutement" + description

---

## 📱 Responsive Checklist

- ✅ Grille adapte le nombre de colonnes
- ✅ Onglets défilent horizontalement sur mobile
- ✅ Barre de recherche full-width sur mobile
- ✅ Cartes s'empilent en 1 colonne
- ✅ Textes tronqués avec `line-clamp`
- ✅ Scrollbar cachée sur les onglets (`.scrollbar-hide`)

---

## 🔗 Dépendances

### NPM Packages
- ✅ `lucide-react` : Icônes
- ✅ `sonner` : Toast notifications
- ✅ `react` : Hooks (useState, useMemo)

### Fichiers Internes
- ✅ `data/marketAgents.ts` : Données des 40 agents
- ✅ `lib/agentTheme.ts` : Système de couleurs centralisé
- ✅ `contexts/agents-context.tsx` : Gestion des agents recrutés
- ✅ `app/globals.css` : Animations CSS

---

## 🎓 Bonnes Pratiques

### ✅ À FAIRE
- Utiliser `useMemo` pour le filtrage (performance)
- Utiliser `getAgentTheme()` pour les couleurs
- Gérer les états vides (no results)
- Ajouter des animations progressives (delay * index)
- Vérifier les doublons avant recrutement

### ❌ À ÉVITER
- Hardcoder les couleurs dans les cartes
- Dupliquer la logique de filtrage
- Oublier de gérer l'état de chargement
- Négliger le responsive
- Créer des agents sans passer par `addAgent()`

---

## 🚀 Prochaines Évolutions Possibles

1. **Tri avancé :** Par prix, popularité, efficacité
2. **Vue détaillée :** Modal avec toutes les compétences
3. **Comparaison :** Sélectionner plusieurs agents pour comparer
4. **Favoris :** Marquer des agents pour plus tard
5. **Recommandations :** Suggérer des agents selon l'équipe actuelle
6. **Pagination :** Si plus de 100 agents
7. **Filtres avancés :** Par prix, par compétence spécifique
8. **Preview 3D :** Aperçu du robot avant recrutement

---

## 📞 Support

**Fichier :** `app/dashboard/recruitment/page.tsx`

**Ligne de debug :**
```typescript
console.log('Filtered agents:', filteredAgents)
console.log('Selected category:', selectedCategory)
console.log('Search query:', searchQuery)
```

**Vérifier l'état :**
```typescript
const { agents, loading } = useAgents()
console.log('My agents:', agents)
console.log('Loading:', loading)
```

---

**Version :** 1.0  
**Date :** Janvier 2026  
**Status :** ✅ Production Ready  
**Build :** Testé et validé
