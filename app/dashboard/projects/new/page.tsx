"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useConductor } from "@/hooks/useConductor"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function NewProjectContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const objectiveFromUrl = searchParams.get("objective") ?? ""
  const [objective, setObjective] = useState(objectiveFromUrl)

  useEffect(() => {
    if (objectiveFromUrl) setObjective(objectiveFromUrl)
  }, [objectiveFromUrl])

  const { createProject, isLoading } = useConductor(user?.id, {
    onSuccess: (data) => {
      if (data?.projectId) router.push(`/dashboard/projects/${data.projectId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = objective.trim()
    if (!trimmed || isLoading) return
    createProject(trimmed)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 lg:p-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm mb-8"
        >
          <ArrowLeft size={18} />
          Retour au Dashboard
        </Link>

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Nouveau Projet</h1>
              <p className="text-sm text-slate-400">Objectif pré-rempli depuis le Cerveau Central</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="objective" className="text-slate-300">
                Objectif
              </Label>
              <Textarea
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: Créer une campagne LinkedIn pour lancer mon produit"
                className="mt-2 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 min-h-[100px] resize-none"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={!objective.trim() || isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Orchestration en cours...
                </>
              ) : (
                "Lancer le projet"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#020617]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      }
    >
      <NewProjectContent />
    </Suspense>
  )
}
