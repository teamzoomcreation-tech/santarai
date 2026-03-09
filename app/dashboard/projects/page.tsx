"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, FolderOpen, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"

type Project = {
  id: string
  name: string
  description: string | null
  progress: number
  status: string
}

function truncate(str: string | null | undefined, max: number): string {
  if (str == null || str === "") return ""
  return str.length <= max ? str : str.slice(0, max).trim() + "…"
}

function StatusBadge({ status, t }: { status: string; t: typeof translations.fr }) {
  const isActive = status === "active"
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
        (isActive
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-slate-500/20 text-slate-400 border border-slate-500/30")
      }
    >
      {isActive ? t.dashboard.projects.active : t.dashboard.projects.archived}
    </span>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
  }, [authLoading, user, router])

  const loadProjects = async () => {
    if (!user?.id) return
    const { data: rows } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
    const list: Project[] = Array.isArray(rows)
      ? rows.map((r: any) => ({
          id: r.id,
          name: r.title ?? r.name ?? "",
          description: r.description ?? null,
          progress: Number(r.progression ?? r.progress) ?? 0,
          status: r.status ?? "active",
        }))
      : []
    setProjects(list)
  }

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setLoading(true)
    loadProjects()
      .then(() => { if (!cancelled) setLoading(false) })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  const handleDeleteProject = async (projectId: string) => {
    // 1. Logs de contrôle
    console.log("🗑️ CLIC SUR SUPPRIMER - ID:", projectId);
    const targetUrl = `/api/projects/${projectId}`;
    console.log("🔗 APPEL URL:", targetUrl);

    try {
      const response = await fetch(targetUrl, {
        method: 'DELETE',
      });

      console.log("📨 STATUT RÉPONSE:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // 2. Succès
      toast.success(t.dashboard.toast.projectDeleted);
      
      // 3. Mise à jour locale immédiate (Optimistic UI)
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      
      // 4. Rafraîchissement serveur
      router.refresh();

    } catch (error: any) {
      console.error("❌ ERREUR FETCH:", error);
      alert(`${error.message}`);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-950/30 px-6 py-3 shrink-0">
        <Link
          href="/dashboard"
          className="text-slate-400 hover:text-cyan-400 flex items-center gap-2 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.dashboard.projects.backToHQ}</span>
        </Link>
      </div>

      <div className="border-b border-slate-800 bg-slate-950/50 px-6 py-4 backdrop-blur-sm shrink-0">
        <h2 className="text-xl font-semibold text-foreground">{t.dashboard.projects.title}</h2>
        <p className="text-sm text-muted-foreground">{t.dashboard.projects.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading ? (
          <div className="flex h-full min-h-[320px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400" />
              <p className="mt-4 text-sm text-muted-foreground">{t.dashboard.projects.loading}</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-full min-h-[320px] items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                <FolderOpen className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t.dashboard.projects.noProjects}</h3>
              <p className="text-sm text-muted-foreground">
                {t.dashboard.projects.useConductor}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative group block rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]"
              >
                <div className="absolute top-2 right-2 z-50">
                  <Button
                    size="icon"
                    className="h-8 w-8 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (confirm(t.dashboard.projects.deleteConfirm)) handleDeleteProject(project.id)
                    }}
                    title={t.dashboard.projects.deleteProject}
                    aria-label="Supprimer le projet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="block pr-10"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                      {project.name}
                    </h3>
                    <StatusBadge status={project.status} t={t: any} />
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {truncate(project.description, 120) || "—"}
                  </p>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t.dashboard.projects.progress}</span>
                    <span className="font-semibold text-cyan-400">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                    />
                  </div>
                    <p className="mt-4 text-sm text-cyan-400/90 group-hover:text-cyan-400">
                    {t.dashboard.projects.open}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
