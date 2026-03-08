'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface ConductorData {
  projectId: string
}

export interface UseConductorOptions {
  /** Appelé après création réussie (ex: redirection ou rafraîchissement) */
  onSuccess?: (data: ConductorData) => void
}

export function useConductor(userId: string | undefined, options?: UseConductorOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ConductorData | null>(null)

  const createProject = useCallback(
    async (objective: string) => {
      const trimmed = objective.trim()
      if (!trimmed) return

      if (!userId) {
        toast.error('Non connecté')
        setError('Utilisateur non connecté')
        return
      }

      setError(null)
      setData(null)
      setIsLoading(true)
      toast.info('Analyse de l\'objectif...', { id: 'conductor-start', duration: 0 })

      try {
        const res = await fetch('/api/conductor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: trimmed, userId }),
        })

        const json = await res.json().catch(() => ({}))
        toast.dismiss('conductor-start')

        if (!res.ok) {
          const message = json.error || res.statusText || 'Erreur lors de la création du projet'
          setError(message)
          toast.error(message)
          return
        }

        if (json.status === 'MISSING_RESOURCES') {
          const msg = json.message || `Agents requis : ${(json.missing_roles || []).join(', ')}. Utilisez le Cerveau Central sur le Dashboard pour déployer l'équipe automatiquement (achat groupé + création du projet).`
          setError(msg)
          toast.error('Ressources manquantes', {
            description: msg,
            duration: 6000,
          })
          return
        }

        const payload = { projectId: json.projectId }
        setData(payload)
        toast.success('Projet initialisé avec succès', {
          description: 'Missions et tâches ont été créées.',
          duration: 4000,
        })
        options?.onSuccess?.(payload)
      } catch (err) {
        toast.dismiss('conductor-start')
        const message = err instanceof Error ? err.message : 'Erreur réseau'
        setError(message)
        toast.error('Orchestration échouée', { description: message })
      } finally {
        setIsLoading(false)
      }
    },
    [userId, options]
  )

  return { createProject, isLoading, error, data }
}
