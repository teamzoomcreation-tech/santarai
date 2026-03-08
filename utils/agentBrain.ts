/**
 * Générateur de pensées contextuelles pour les agents
 * Simule le travail réel selon le rôle et la progression
 */

export function generateAgentThought(role: string, progress: number): string {
  const roleLower = role.toLowerCase()
  
  // Détection du type d'agent basée sur le rôle
  let agentType: 'DEV' | 'DESIGN' | 'MARKETING' | 'COPYWRITER' | 'OTHER' = 'OTHER'
  
  if (roleLower.includes('dev') || roleLower.includes('engineer') || roleLower.includes('architect') || roleLower.includes('programmer') || roleLower.includes('coder')) {
    agentType = 'DEV'
  } else if (roleLower.includes('design') || roleLower.includes('graphic') || roleLower.includes('ui') || roleLower.includes('ux') || roleLower.includes('artistique')) {
    agentType = 'DESIGN'
  } else if (roleLower.includes('marketing') || roleLower.includes('seo') || roleLower.includes('social') || roleLower.includes('media') || roleLower.includes('brand')) {
    agentType = 'MARKETING'
  } else if (roleLower.includes('copywriter') || roleLower.includes('copy') || roleLower.includes('rédacteur') || roleLower.includes('content')) {
    agentType = 'COPYWRITER'
  }

  // Phases de progression
  const phase = progress < 30 ? 'start' : progress < 70 ? 'middle' : 'end'

  switch (agentType) {
    case 'DEV':
      if (phase === 'start') {
        const thoughts = [
          'Analyse des spécifications techniques...',
          'Initialisation de l\'environnement de développement',
          'Examen de la structure du code existant',
          'Configuration des dépendances et outils',
          'Recherche de solutions optimales',
          'Planification de l\'architecture',
          'Vérification des contraintes techniques'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else if (phase === 'middle') {
        const thoughts = [
          'Implémentation des fonctionnalités core',
          'Optimisation des performances',
          'Écriture des tests unitaires',
          'Refactoring du code legacy',
          'Intégration des APIs externes',
          'Débogage des erreurs critiques',
          'Amélioration de la structure des données'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else {
        const thoughts = [
          'Finalisation et relecture du code',
          'Minification et optimisation finale',
          'Documentation technique complète',
          'Tests d\'intégration en cours',
          'Préparation du déploiement',
          'Vérification de la sécurité',
          'Optimisation des requêtes SQL'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      }

    case 'DESIGN':
      if (phase === 'start') {
        const thoughts = [
          'Recherche d\'inspiration et moodboard',
          'Analyse des besoins utilisateur',
          'Esquisse des premières idées',
          'Étude de la charte graphique',
          'Planification de la hiérarchie visuelle',
          'Sélection de la palette de couleurs',
          'Recherche de typographies adaptées'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else if (phase === 'middle') {
        const thoughts = [
          'Création des maquettes détaillées',
          'Affinage des compositions',
          'Optimisation des contrastes',
          'Ajustement des espacements',
          'Intégration des éléments visuels',
          'Test de différentes variantes',
          'Amélioration de l\'ergonomie'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else {
        const thoughts = [
          'Finalisation des détails visuels',
          'Export et optimisation des assets',
          'Vérification de la cohérence',
          'Préparation des fichiers de production',
          'Relecture et corrections finales',
          'Validation de la qualité pixel-perfect',
          'Optimisation pour différents formats'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      }

    case 'MARKETING':
      if (phase === 'start') {
        const thoughts = [
          'Analyse du marché cible',
          'Recherche des tendances actuelles',
          'Étude de la concurrence',
          'Définition de la stratégie de contenu',
          'Planification des canaux de diffusion',
          'Analyse des métriques existantes',
          'Identification des opportunités'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else if (phase === 'middle') {
        const thoughts = [
          'Création du calendrier éditorial',
          'Optimisation des campagnes publicitaires',
          'A/B testing des variantes',
          'Analyse des performances en temps réel',
          'Ajustement du budget publicitaire',
          'Engagement avec la communauté',
          'Amélioration du ROI'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else {
        const thoughts = [
          'Finalisation des rapports d\'analyse',
          'Optimisation finale des performances',
          'Préparation des insights stratégiques',
          'Relecture et validation du contenu',
          'Export des métriques clés',
          'Documentation de la stratégie',
          'Planification des prochaines étapes'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      }

    case 'COPYWRITER':
      if (phase === 'start') {
        const thoughts = [
          'Recherche et analyse du brief',
          'Étude du ton de voix de la marque',
          'Brainstorming des concepts créatifs',
          'Recherche de mots-clés pertinents',
          'Analyse du public cible',
          'Planification de la structure',
          'Collecte d\'informations complémentaires'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else if (phase === 'middle') {
        const thoughts = [
          'Rédaction du premier jet',
          'Affinage du message principal',
          'Optimisation de la structure AIDA',
          'Amélioration de l\'accroche',
          'Intégration des call-to-actions',
          'Test de différentes formulations',
          'Renforcement de l\'argumentaire'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else {
        const thoughts = [
          'Relecture et correction finale',
          'Optimisation SEO du contenu',
          'Vérification de la cohérence',
          'Polissage du style et du ton',
          'Validation de la longueur optimale',
          'Finalisation des métadonnées',
          'Préparation pour publication'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      }

    default:
      // Pour les autres rôles (Support, Sales, Finance, etc.)
      if (phase === 'start') {
        const thoughts = [
          'Analyse de la demande',
          'Recherche d\'informations',
          'Planification de l\'approche',
          'Initialisation du processus',
          'Étude des données disponibles',
          'Préparation des outils nécessaires',
          'Examen des cas similaires'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else if (phase === 'middle') {
        const thoughts = [
          'Traitement en cours',
          'Exécution des actions planifiées',
          'Optimisation des résultats',
          'Ajustement des paramètres',
          'Suivi de la progression',
          'Amélioration continue',
          'Résolution des problèmes'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      } else {
        const thoughts = [
          'Finalisation en cours',
          'Vérification de la qualité',
          'Relecture et validation',
          'Préparation du livrable',
          'Documentation des résultats',
          'Optimisation finale',
          'Préparation pour livraison'
        ]
        return thoughts[Math.floor(Math.random() * thoughts.length)]
      }
  }
}
