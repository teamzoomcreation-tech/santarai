"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { availableProfiles, type AgentProfile } from "./marketplace"
import { useAgentStore } from "@/stores/useAgentStore"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"

interface RecruitAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecruitAgentDialog({ open, onOpenChange }: RecruitAgentDialogProps) {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr
  const addAgent = useAgentStore((s) => s.addAgent)
  const [showStamp, setShowStamp] = useState(false)

  const handleRecruit = async (profile: AgentProfile) => {
    try {
      await addAgent({
        name: profile.name,
        role: profile.name,
        status: 'idle',
        avatar: { color: profile.color || 'cyan' },
        tasksCompleted: 0,
        efficiency: 85,
      })
      setShowStamp(true)
      toast.success(t.dashboard.recruitDialog.recruitSuccess.replace('{name}', profile.name), {
        description: t.dashboard.recruitDialog.recruitSuccessDesc.replace('{cost}', profile.cost),
        duration: 3000,
      })
      setTimeout(() => {
        setShowStamp(false)
        onOpenChange(false)
      }, 1800)
    } catch (e: any) {
      toast.error(t.dashboard.recruitDialog.recruitError, {
        description: e?.message || t.dashboard.recruitDialog.recruitErrorDesc,
      })
    }
  }

  const colorConfig: Record<string, string> = {
    cyan: "from-cyan-500 to-blue-600 border-cyan-500/30",
    emerald: "from-emerald-500 to-teal-600 border-emerald-500/30",
    amber: "from-amber-500 to-orange-600 border-amber-500/30",
    violet: "from-violet-500 to-purple-600 border-violet-500/30",
  }

  const textColorConfig: Record<string, string> = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-950 border-cyan-900/30 backdrop-blur-xl relative overflow-hidden">
        <AnimatePresence>
          {showStamp && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
              animate={{ scale: 1.2, opacity: 1, rotate: 12 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className="px-12 py-6 rounded-lg border-4 border-emerald-500/90 bg-emerald-500/10 text-emerald-400 font-black text-2xl md:text-3xl tracking-widest shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                style={{ textShadow: "0 0 20px rgba(16,185,129,0.5)" }}
              >
                CONTRAT SIGNÉ
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-foreground">
            {t.dashboard.recruitDialog.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t.dashboard.recruitDialog.descriptionSr}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {availableProfiles.map((profile) => {
              const Icon = profile.icon
              const colorClasses = colorConfig[profile.color] || colorConfig.cyan
              const textColor = textColorConfig[profile.color] || textColorConfig.cyan

              const borderColorClass = {
                cyan: "border-cyan-500/30",
                emerald: "border-emerald-500/30",
                amber: "border-amber-500/30",
                violet: "border-violet-500/30",
              }[profile.color] || "border-cyan-500/30"

              return (
                <div
                  key={profile.id}
                  className={cn(
                    "group relative rounded-xl border bg-gray-900/50 p-5 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]",
                    borderColorClass
                  )}
                >
                  {/* Icon */}
                  <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br", colorClasses)}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>
                  </div>

                  {/* Cost */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.dashboard.recruitDialog.monthlyCost}</span>
                    <span className={cn("text-sm font-semibold", textColor)}>{profile.cost}</span>
                  </div>

                  {/* Recruit Button */}
                  <Button
                    onClick={() => handleRecruit(profile)}
                    className={cn(
                      "w-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    )}
                  >
                    {t.dashboard.recruitDialog.recruitButton}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
