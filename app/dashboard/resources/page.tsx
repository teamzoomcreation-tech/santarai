"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"
import { supabase } from "@/lib/supabase/client"
import {
  FileText,
  Image,
  File,
  Trash2,
  Upload,
  Loader2,
  Database,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const BUCKET = "company_docs"

interface Resource {
  id: string
  title: string
  file_url: string
  file_type: string | null
  size: number | null
  created_at: string
}

function getFileIcon(type: string | null) {
  if (!type) return File
  const t = type.toLowerCase()
  if (t.includes("pdf")) return FileText
  if (t.includes("image") || t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("webp") || t.includes("gif"))
    return Image
  return File
}

function formatSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return "—"
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function truncate(str: string, max: number): string {
  if (!str || str.length <= max) return str
  const ext = str.includes(".") ? str.split(".").pop() ?? "" : ""
  const name = str.replace(/\.[^/.]+$/, "")
  const keep = max - ext.length - 4 // "..."
  return keep > 0 ? `${name.slice(0, keep)}....${ext}` : str.slice(0, max)
}

export default function ResourcesPage() {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const { user } = useAuth()
  const [files, setFiles] = useState<Resource[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadResources = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, file_url, file_type, size, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setFiles((data ?? []) as Resource[])
    } catch (e: any) {
      console.error("Erreur chargement ressources:", e)
      toast.error((t as any).dashboard.resources.loadError, { description: e?.message })
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) {
      toast.error((t as any).dashboard.resources.notConnected)
      return
    }
    const input = e.target
    const selected = input.files
    if (!selected || selected.length === 0) return

    setUploading(true)
    let successCount = 0

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const path = `${user.id}/${Date.now()}-${safeName}`

      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path)

        const fileUrl = urlData.publicUrl
        const fileType = file.type || "application/octet-stream"
        const size = file.size

        const { error: insertError } = await supabase.from("resources").insert({
          user_id: user.id,
          title: file.name,
          file_url: fileUrl,
          file_type: fileType,
          size,
        })

        if (insertError) throw insertError
        successCount++
      } catch (err: any) {
        toast.error(`Échec: ${file.name}`, { description: err?.message ?? t.dashboard.resources.uploadFailed })
      }
    }

    input.value = ""
    setUploading(false)
    if (successCount > 0) {
      toast.success(t.dashboard.resources.filesAddedSuccess.replace('{count}', String(successCount)))
      loadResources()
    }
  }

  const handleDelete = async (r: Resource) => {
    if (!user?.id) return
    if (!confirm(t.dashboard.resources.deleteConfirm)) return

    try {
      const pathMatch = r.file_url.match(/company_docs\/(.+)$/)
      const path = pathMatch?.[1]
      if (path) {
        await supabase.storage.from(BUCKET).remove([path])
      }
      const { error } = await supabase.from("resources").delete().eq("id", r.id)
      if (error) throw error
      toast.success(t.dashboard.resources.fileDeleted)
      loadResources()
    } catch (e: any) {
      toast.error(t.dashboard.resources.deleteError, { description: e?.message })
    }
  }

  return (
    <div className="min-h-screen space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-cyan-400" />
          {t.dashboard.resources.title}
        </h1>
        <p className="text-slate-400 text-sm">
          {t.dashboard.resources.subtitle}
        </p>
      </div>

      {/* Zone d'upload */}
      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 md:p-12 transition-all",
          "border-cyan-500/30 bg-slate-900/50 hover:border-cyan-400/50 hover:bg-slate-900/70",
          uploading && "opacity-70 pointer-events-none"
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={t.dashboard.resources.uploadLabel}
        />
        <div className="flex flex-col items-center justify-center gap-3 text-center pointer-events-none">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
              <p className="text-slate-300 font-medium">{t.dashboard.resources.uploading}</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-cyan-400" />
              <p className="text-slate-300 font-medium">
                {t.dashboard.resources.dropzone}
              </p>
              <p className="text-slate-500 text-xs">{t.dashboard.resources.dropzoneHint}</p>
            </>
          )}
        </div>
      </div>

      {/* Grille des fichiers */}
      <div>
        <h2 className="text-lg font-bold text-slate-300 uppercase tracking-wider mb-4">
          {t.dashboard.resources.files} ({files.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 border-dashed p-12 text-center text-slate-500">
            <File className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t.dashboard.resources.noFiles}</p>
            <p className="text-sm mt-1">{t.dashboard.resources.noFilesHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {files.map((r) => {
              const Icon = getFileIcon(r.file_type)
              return (
                <Card
                  key={r.id}
                  className="group border-slate-700 hover:border-cyan-500/30 transition-all overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-slate-200 truncate"
                          title={r.title}
                        >
                          {truncate(r.title, 28)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatSize(r.size)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-2 pt-0 flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      asChild
                    >
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {t.dashboard.resources.open}
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(r)}
                      aria-label={t.dashboard.resources.deleteAria}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
