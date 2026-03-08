import { create } from "zustand"

interface PerformanceStoreState {
  timeSaved: number // Temps économisé en heures
  savings: number // Argent économisé (coût IA vs Humain)
  efficiency: number // Efficacité opérationnelle (0-100%)
  activeAgents: number // Nombre d'agents actifs
  recordTaskCompletion: () => void
  incrementStats: () => void // +0.1h à 0.5h et coût à 50$/h (déclenché par le Chat)
  reset: () => void
}

export const usePerformanceStore = create<PerformanceStoreState>((set) => ({
  timeSaved: 124, // Heures économisées
  savings: 8750, // $ économisés (coût humain - coût IA)
  efficiency: 87, // Efficacité opérationnelle en %
  activeAgents: 3,
  
  recordTaskCompletion: () => {
    set((state) => {
      // Chaque tâche complétée économise environ 0.5-1.5 heures
      const hoursSaved = Math.random() * 1 + 0.5
      
      // Chaque tâche économise environ $50-150 (coût humain vs IA)
      const savingsIncrement = Math.floor(Math.random() * 100) + 50
      
      // Variation légère de l'efficacité entre 85% et 95%
      const efficiencyVariation = Math.random() * 0.1 - 0.05 // Entre -0.05 et +0.05
      const newEfficiency = Math.max(85, Math.min(95, state.efficiency + efficiencyVariation))
      
      return {
        timeSaved: Math.round((state.timeSaved + hoursSaved) * 10) / 10,
        savings: state.savings + savingsIncrement,
        efficiency: Math.round(newEfficiency * 10) / 10, // Arrondir à 1 décimale
      }
    })
  },

  incrementStats: () => {
    set((state) => {
      const hoursAdded = Math.round((Math.random() * 0.4 + 0.1) * 10) / 10 // 0.1 à 0.5 h
      const costPerHour = 50
      const savingsAdded = Math.round(hoursAdded * costPerHour)
      return {
        timeSaved: Math.round((state.timeSaved + hoursAdded) * 10) / 10,
        savings: state.savings + savingsAdded,
      }
    })
  },
  
  reset: () => {
    set({
      timeSaved: 124,
      savings: 8750,
      efficiency: 87,
      activeAgents: 3,
    })
  },
}))
