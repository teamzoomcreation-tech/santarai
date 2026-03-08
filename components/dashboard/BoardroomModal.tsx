"use client"

import React, { useCallback } from "react"
import { X, Send, Users } from "lucide-react"
import { useDashboardStore } from "@/lib/store"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { translations } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export interface BoardroomAgent {
  id: string
  name: string
  role: string
}

interface BoardroomModalProps {
  open: boolean
  onClose: () => void
  agents: BoardroomAgent[]
}

export function BoardroomModal({ open, onClose, agents }: BoardroomModalProps) {
  const { currentLang } = useLanguage()
  const t = translations[currentLang] ?? translations.fr

  const meetingObjective = useDashboardStore((s) => s.meetingObjective)
  const setMeetingObjective = useDashboardStore((s) => s.setMeetingObjective)
  const meetingSelectedAgentIds = useDashboardStore((s) => s.meetingSelectedAgentIds)
  const setMeetingSelectedAgentIds = useDashboardStore((s) => s.setMeetingSelectedAgentIds)
  const broadcastMeetingDirective = useDashboardStore((s) => s.broadcastMeetingDirective)

  const toggleAgent = useCallback(
    (id: string) => {
      const next = meetingSelectedAgentIds.includes(id)
        ? meetingSelectedAgentIds.filter((x) => x !== id)
        : [...meetingSelectedAgentIds, id]
      setMeetingSelectedAgentIds(next)
    },
    [meetingSelectedAgentIds, setMeetingSelectedAgentIds]
  )

  const handleBroadcast = useCallback(() => {
    if (meetingSelectedAgentIds.length === 0) {
      toast.error(t.dashboard.hq.boardroom.selectAtLeastOne)
      return
    }
    broadcastMeetingDirective()
    toast.success(t.dashboard.hq.boardroom.successMessage)
  }, [meetingSelectedAgentIds.length, broadcastMeetingDirective, t])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={cn(
          "relative flex h-full w-full max-h-full max-w-4xl flex-col rounded-none border border-cyan-500/30 bg-gray-950 shadow-2xl",
          "m-0 sm:m-4 sm:rounded-xl sm:max-h-[90vh]"
        )}
        aria-modal="true"
        role="dialog"
        aria-labelledby="boardroom-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-cyan-900/30 px-6 py-4">
          <h2 id="boardroom-title" className="text-lg font-bold text-foreground">
            {t.dashboard.hq.boardroom.title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label={t.dashboard.hq.boardroom.close}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
          <div className="space-y-2">
            <Label htmlFor="boardroom-objective" className="text-foreground">
              {t.dashboard.hq.boardroom.objectiveLabel}
            </Label>
            <Textarea
              id="boardroom-objective"
              value={meetingObjective}
              onChange={(e) => setMeetingObjective(e.target.value)}
              placeholder={t.dashboard.hq.boardroom.objectivePlaceholder}
              className="min-h-[100px] resize-y bg-gray-900/50 border-cyan-900/30 text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-cyan-400" />
              {t.dashboard.hq.boardroom.selectSalariés}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {agents.map((agent) => {
                const selected = meetingSelectedAgentIds.includes(agent.id)
                return (
                  <button
                    type="button"
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selected
                        ? "border-cyan-500/60 bg-cyan-500/10 text-foreground"
                        : "border-gray-800 bg-gray-900/50 text-muted-foreground hover:border-cyan-900/50 hover:bg-gray-900"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center",
                        selected ? "border-cyan-400 bg-cyan-500/30" : "border-gray-600"
                      )}
                    >
                      {selected && <div className="h-2 w-2 rounded-full bg-cyan-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{agent.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{agent.role}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            {agents.length === 0 && (
              <p className="text-sm text-muted-foreground">{t.dashboard.hq.noUnits}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-cyan-900/30 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} className="border-gray-700">
            {t.dashboard.hq.boardroom.close}
          </Button>
          <Button
            type="button"
            onClick={handleBroadcast}
            className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
          >
            <Send className="h-4 w-4" />
            {t.dashboard.hq.boardroom.diffuseDirective}
          </Button>
        </div>
      </div>
    </div>
  )
}
