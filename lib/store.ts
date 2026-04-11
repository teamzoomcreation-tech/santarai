import { create } from 'zustand'
import { MARKET_CATALOG, type MarketAgent, type MarketCategory } from '@/lib/catalog'
import type { Project } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { getAgents } from '@/lib/supabase/database'
import { getTreasury, debitTreasury, getPlan } from '@/lib/supabase/user-balance'

export type { MarketAgent, MarketCategory }
export { MARKET_CATALOG } from '@/lib/catalog'
export type { Project, Task } from '@/types'

export type TransactionType = 'CREDIT' | 'DEBIT'

export interface Transaction {
  id: string
  date: string
  amount: number
  type: TransactionType
  description: string
}

export interface Agent {
  id: string
  name: string
  role: string
  status: 'Standby' | 'Working' | 'Offline'
  currentTask: string | null
  progress: number
  /** @deprecated Préférer userDirectives (surcouche utilisateur, noyau restant privé) */
  customDirective?: string
  /** Directives opérationnelles (surcouche). Le noyau système n'est jamais exposé. */
  userDirectives?: string
}

interface LogEntry {
  id: number
  time: string
  source: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface MissionReport {
  id: string
  agentName: string
  taskName: string
  date: string
  cost: number
  status: 'COMPLETED' | 'FAILED'
  resultSummary: string
}

export type MissionStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed'

export interface Mission {
  id: string
  projectId?: string | null
  agentId: string
  agentName: string
  title: string
  status: MissionStatus
  date: string
  cost: number
  resultSnippet?: string
  tasks?: import('@/types').Task[]
  /** true une fois que l'utilisateur a ouvert la modale (œil) — la pastille ne compte plus cette entrée */
  isRead?: boolean
}

const PLANS = {
  FREE: { limit: 25_000 },
  STARTER: { limit: 500_000 },
  PRO: { limit: 2_500_000 },
  ENTERPRISE: { limit: 15_000_000 },
} as const

/** Solde initial Freemium pour les nouveaux utilisateurs (aucune ligne user_balance) */
const FREEMIUM_INITIAL = 25_000

export interface NotificationSettings {
  emailUpdates: boolean
  pushNotifications: boolean
  dailyReports: boolean
  missionCompleted: boolean
  lowCreditsWarning: boolean
}

const INITIAL_NOTIFICATIONS: NotificationSettings = {
  emailUpdates: true,
  pushNotifications: false,
  dailyReports: false,
  missionCompleted: true,
  lowCreditsWarning: true,
}

export interface CompanySettings {
  name: string
  email: string
  language: string
  website?: string
  industry?: string
  size?: string
  pitch?: string
  phone?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  targetAudience?: string
  tone?: string
  budgetAlertThreshold?: number
  notifications?: NotificationSettings
}

const INITIAL_SETTINGS: CompanySettings = {
  name: '',
  email: '',
  language: '',
  website: '',
  industry: '',
  size: '',
  pitch: '',
  phone: '',
  linkedin: '',
  twitter: '',
  instagram: '',
  targetAudience: '',
  tone: '',
  budgetAlertThreshold: 5000,
  notifications: INITIAL_NOTIFICATIONS,
}

export type SubscriptionTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'

interface DashboardState {
  savedTime: number
  tokens: number
  treasuryLoading: boolean
  efficiency: number
  logs: LogEntry[]
  agents: Agent[]
  transactions: Transaction[]
  completedMissions: MissionReport[]
  missions: Mission[]
  projects: Project[]
  activeProject: Project | null
  settings: CompanySettings
  subscriptionTier: SubscriptionTier
  processUserRequest: (agentName: string, userMessage: string) => void
  tick: () => void
  reset: () => void
  recruitAgent: (agentOrId: string | MarketAgent) => Promise<'SUCCESS' | 'ERROR' | { status: 'INSUFFICIENT_FUNDS'; missing: number }>
  recruitTeam: (agentIds: string[], totalCost: number) => Promise<{ ok: true } | { ok: false; error: string }>
  terminateContract: (agentId: string) => void
  updateAgentDirective: (agentId: string, directive: string) => void
  updateAgentDirectives: (agentId: string, directives: string) => void
  addTransaction: (amount: number, type: TransactionType, description: string) => void
  deductTreasury: (amount: number) => void
  fetchTreasury: (userId: string) => Promise<void>
  setTreasury: (amount: number) => void
  logMission: (agentId: string, title: string, cost: number, projectId?: string | null) => string
  addMissionFromDb: (mission: Mission) => void
  completeMission: (missionId: string, resultSnippet?: string, cost?: number) => void
  markMissionAsRead: (id: string) => void
  deleteMission: (id: string) => void
  updateSettings: (newSettings: Partial<CompanySettings>) => void
  toggleNotification: (key: keyof NotificationSettings) => void
  updateSubscription: (tier: SubscriptionTier, options?: { source?: 'stripe' }) => void
  resetSystem: () => void
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  setActiveProject: (project: Project | null) => void
  syncAgentsFromSupabase: (userId: string) => Promise<void>
  activeChatAgentId: string | null
  setActiveChatAgentId: (id: string | null) => void
  /** Compteur de missions non lues (pastille Sidebar) — mis à jour au chargement et décrémenté au clic "Voir". */
  missionsUnreadCount: number
  setMissionsUnreadCount: (n: number) => void
  decrementMissionsUnreadCount: () => void
  /** Réunion stratégique (Boardroom) */
  boardroomOpen: boolean
  setBoardroomOpen: (open: boolean) => void
  meetingObjective: string
  setMeetingObjective: (v: string) => void
  meetingSelectedAgentIds: string[]
  setMeetingSelectedAgentIds: (ids: string[]) => void
  meetingDirectiveSent: boolean
  setMeetingDirectiveSent: (v: boolean) => void
  broadcastMeetingDirective: () => void
}

const INITIAL_AGENTS: Agent[] = [
  { id: 'ghost', name: 'GHOST', role: 'Infiltrator', status: 'Standby', currentTask: null, progress: 0 },
  { id: 'kaiju', name: 'KAIJU', role: 'Heavy Ops', status: 'Standby', currentTask: null, progress: 0 },
  { id: 'radar', name: 'RADAR', role: 'Trend Hunter', status: 'Standby', currentTask: null, progress: 0 },
  { id: 'katana', name: 'KATANA', role: 'Precision Strike', status: 'Standby', currentTask: null, progress: 0 },
  { id: 'akira', name: 'AKIRA', role: 'Neural Core', status: 'Standby', currentTask: null, progress: 0 },
]

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  savedTime: 124.0,
  tokens: 0,
  treasuryLoading: true,
  efficiency: 87.0,
  logs: [],
      agents: [],
      transactions: [],
      completedMissions: [],
      missions: [],
      projects: [],
      activeProject: null,
      settings: INITIAL_SETTINGS,
      subscriptionTier: 'FREE',
      activeChatAgentId: null,
      missionsUnreadCount: 0,
      boardroomOpen: false,
      meetingObjective: '',
      meetingSelectedAgentIds: [],
      meetingDirectiveSent: false,

      setProjects: (projects) => set({ projects }),
      addProject: (project) => set((state) => ({ projects: [project, ...state.projects] })),
      setActiveProject: (activeProject) => set({ activeProject }),
      setActiveChatAgentId: (id) => set({ activeChatAgentId: id }),
      setMissionsUnreadCount: (n) => set({ missionsUnreadCount: Math.max(0, n) }),
      decrementMissionsUnreadCount: () => set((s) => ({ missionsUnreadCount: Math.max(0, (s.missionsUnreadCount ?? 0) - 1) })),

      setBoardroomOpen: (open) => set((s) => (s.boardroomOpen === open ? s : { ...s, boardroomOpen: open })),
      setMeetingObjective: (v) => set((s) => (s.meetingObjective === v ? s : { ...s, meetingObjective: v })),
      setMeetingSelectedAgentIds: (ids) => set((s) => (s.meetingSelectedAgentIds === ids ? s : { ...s, meetingSelectedAgentIds: ids })),
      setMeetingDirectiveSent: (v) => set((s) => (s.meetingDirectiveSent === v ? s : { ...s, meetingDirectiveSent: v })),
      broadcastMeetingDirective: () => set((s) => (s.meetingDirectiveSent ? s : { ...s, meetingDirectiveSent: true })),

      syncAgentsFromSupabase: async (userId) => {
        if (!userId) return
        try {
          const data = await getAgents(userId)
          const mapped: Agent[] = data.map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            status: (a.status === 'active' ? 'Working' : 'Standby') as Agent['status'],
            currentTask: null,
            progress: 0,
          }))
          set({ agents: mapped })
        } catch (err) {
          console.error('syncAgentsFromSupabase:', err)
        }
      },

      addTransaction: (amount, type, description) => {
        const tx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          date: new Date().toISOString(),
          amount,
          type,
          description,
        }
        set((state) => ({ transactions: [tx, ...state.transactions].slice(0, 500) }))
      },

      deductTreasury: (amount) => {
        set((state) => ({
          tokens: Math.max(0, state.tokens - amount),
        }))
      },

      fetchTreasury: async (userId) => {
        if (!userId) {
          set({ treasuryLoading: false })
          return
        }
        try {
          set({ treasuryLoading: true })
          // Charger trésorerie ET plan en parallèle depuis user_balance
          const [treasury, plan] = await Promise.all([
            getTreasury(supabase, userId),
            getPlan(supabase, userId),
          ])
          set({ tokens: treasury, subscriptionTier: plan, treasuryLoading: false })
        } catch (err) {
          console.error('[fetchTreasury] Erreur chargement user_balance:', err)
          set({ tokens: FREEMIUM_INITIAL, subscriptionTier: 'FREE', treasuryLoading: false })
        }
      },

      setTreasury: (amount) => {
        set({ tokens: Math.max(0, amount) })
      },

      updateSettings: (newSettings) => {
        const state = get()
        set({ settings: { ...state.settings, ...newSettings } })
      },

      toggleNotification: (key) => {
        const state = get()
        const notifications = { ...INITIAL_NOTIFICATIONS, ...state.settings.notifications }
        set({
          settings: {
            ...state.settings,
            notifications: { ...notifications, [key]: !notifications[key] },
          },
        })
      },

      updateSubscription: (tier, options) => {
        const bonusTokens = PLANS[tier].limit
        set((state) => ({
          subscriptionTier: tier,
          tokens: state.tokens + bonusTokens,
        }))
        const description = options?.source === 'stripe' ? 'Recharge Carte Bancaire' : `Recharge plan ${tier}`
        get().addTransaction(bonusTokens, 'CREDIT', description)
      },

      resetSystem: () => {
        set({
          savedTime: 0,
          tokens: 0,
          treasuryLoading: true,
          logs: [],
          agents: [],
          completedMissions: [],
          missions: [],
          projects: [],
          activeProject: null,
          settings: INITIAL_SETTINGS,
          subscriptionTier: 'FREE',
        })
      },

      logMission: (agentId, title, cost, projectId) => {
        const state = get()
        const agentName =
          agentId === 'system'
            ? 'SANTARAI SYSTEM'
            : MARKET_CATALOG.find((a) => a.id === agentId)?.name ?? agentId.toUpperCase().replace(/_/g, ' ')
        const mission: Mission = {
          id: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          projectId: projectId ?? undefined,
          agentId,
          agentName,
          title,
          status: 'In Progress',
          date: new Date().toISOString(),
          cost,
          isRead: false,
        }
        set({ missions: [mission, ...state.missions].slice(0, 200) })
        return mission.id
      },

      addMissionFromDb: (mission) =>
        set((state) => ({
          missions: [mission, ...state.missions.filter((m) => m.id !== mission.id)].slice(0, 200),
        })),

      markMissionAsRead: (id) =>
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === id ? { ...m, isRead: true } : m
          ),
        })),

      deleteMission: (id) =>
        set((state) => ({
          missions: state.missions.filter((m) => m.id !== id),
        })),

      completeMission: (missionId, resultSnippet, cost) => {
        const state = get()
        const status: MissionStatus = resultSnippet !== undefined ? 'Completed' : 'Failed'
        const updated = state.missions.map((m) =>
          m.id === missionId
            ? { ...m, status, resultSnippet, ...(cost !== undefined ? { cost } : {}) }
            : m
        )
        set({ missions: updated })
      },

      processUserRequest: (agentName, message) => {
        const state = get()
        const lowerMsg = message.toLowerCase()

        let taskName = 'Traitement général'
        let cost = 5
        let time = 0.1

        if (lowerMsg.includes('analyse') || lowerMsg.includes('audit')) {
          taskName = 'Analyse Deep Data'
          cost = 25
          time = 0.5
        } else if (lowerMsg.includes('écris') || lowerMsg.includes('post') || lowerMsg.includes('rédaction')) {
          taskName = 'Rédaction Virale'
          cost = 15
          time = 0.3
        } else if (lowerMsg.includes('chercher') || lowerMsg.includes('trouve')) {
          taskName = 'Scraping Web'
          cost = 10
          time = 0.2
        } else if (lowerMsg.includes('image') || lowerMsg.includes('visuel')) {
          taskName = 'Génération Visuelle'
          cost = 40
          time = 0.8
        }

        const newTime = state.savedTime + time

        const newLog: LogEntry = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          source: 'SANTARAI',
          message: `Ordre : "${taskName}" envoyé à ${agentName}`,
          type: 'success',
        }

        const newAgents = state.agents.map((a) => {
          if (a.name === agentName || (agentName === 'SANTARAI SYSTEM' && a.id === 'ghost')) {
            return { ...a, status: 'Working' as const, currentTask: taskName, progress: 5 }
          }
          return a
        })

        set({
          savedTime: newTime,
          logs: [newLog, ...state.logs].slice(0, 50),
          agents: newAgents,
        })
      },

      tick: () => {
        const state = get()
        const hasWorkingAgents = state.agents.some((a) => a.status === 'Working')
        if (!hasWorkingAgents) return

        const reports: MissionReport[] = []
        const newLogs: LogEntry[] = []

        const newAgents = state.agents.map((agent) => {
          if (agent.status !== 'Working') return agent
          const newProgress = agent.progress + (Math.random() * 5 + 2)
          if (newProgress >= 100) {
            reports.push({
              id: Date.now().toString(),
              agentName: agent.name,
              taskName: agent.currentTask || 'Tâche Inconnue',
              date: new Date().toLocaleString('fr-FR'),
              cost: 15,
              status: 'COMPLETED',
              resultSummary: 'Opération finalisée. Données sécurisées.',
            })
            newLogs.push({
              id: Date.now(),
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              source: 'SANTARAI',
              message: `Mission terminée par ${agent.name}`,
              type: 'success',
            })
            return { ...agent, status: 'Standby' as const, currentTask: null, progress: 0 }
          }
          return { ...agent, progress: newProgress }
        })

        set({
          agents: newAgents,
          ...(reports.length > 0 && {
            completedMissions: [...reports, ...state.completedMissions],
            logs: [...newLogs, ...state.logs].slice(0, 50),
          }),
        })
      },

      recruitAgent: async (agentOrId) => {
        const state = get()
        const agentToBuy: MarketAgent | undefined =
          typeof agentOrId === 'string'
            ? MARKET_CATALOG.find((a) => a.id === agentOrId)
            : agentOrId
        if (!agentToBuy) return 'ERROR'
        const agentId = agentToBuy.id
        const price = agentToBuy.monthlyCost

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('recruitAgent: utilisateur non connecté')
          return 'ERROR'
        }

        // Vérifier inventaire : éviter doublon
        if (state.agents.some((a) => a.id === agentId)) return 'SUCCESS'

        let debitResult: { ok: boolean; newBalance: number; error?: string }
        try {
          // 1. Lire le solde actuel dans user_balance (source de vérité)
          const currentTreasury = await getTreasury(supabase, user.id)
          if (currentTreasury < price) {
            const missing = Math.max(0, price - currentTreasury)
            return { status: 'INSUFFICIENT_FUNDS', missing }
          }

          // 2. Mettre à jour le solde (UPDATE user_balance) AVANT tout INSERT
          debitResult = await debitTreasury(supabase, user.id, price)
          if (!debitResult.ok) {
            console.error('recruitAgent debitTreasury échec:', debitResult.error)
            const missing = Math.max(0, price - (debitResult.newBalance ?? 0))
            return { status: 'INSUFFICIENT_FUNDS', missing }
          }

          // 3. INSERT user_agents (inventaire utilisateur)
          const { error: uaErr } = await supabase
            .from('user_agents')
            .insert({ user_id: user.id, agent_id: agentId })
          if (uaErr && uaErr.code !== '23505') {
            console.error('recruitAgent: Erreur user_agents INSERT', uaErr)
            // Rollback : remettre le solde
            const { error: rollbackErr } = await supabase.from('user_balance').upsert(
              { user_id: user.id, treasury: debitResult.newBalance + price, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            )
            if (rollbackErr) console.error('recruitAgent: Rollback treasury échoué', rollbackErr)
            return 'ERROR'
          }
          const categoryToColor: Record<MarketCategory, string> = {
            MARKETING: 'pink',
            TECH: 'blue',
            SALES: 'green',
            ADMIN: 'slate',
            DATA: 'cyan',
            ELITE: 'yellow',
          }
          // 4. INSERT agents (table conductor)
          const { error: agentsErr } = await supabase
            .from('agents')
            .insert({
              user_id: user.id,
              name: agentToBuy.name,
              role: agentToBuy.role,
              status: 'idle',
              avatar_color: categoryToColor[agentToBuy.category] || 'cyan',
              tasks_completed: 0,
              efficiency: 85,
            })
          if (agentsErr) {
            console.error('recruitAgent: Erreur agents INSERT', agentsErr)
            // Pas de rollback user_agents (23505 = déjà possédé). Rollback treasury seulement si besoin.
          }
        } catch (err) {
          console.error('[recruitAgent] Exception Supabase:', err)
          return 'ERROR'
        }

        // Vérification de sécurité : debitResult doit être défini avant mise à jour locale
        if (!debitResult || !debitResult.ok) {
          console.error('[recruitAgent] debitResult invalide avant mise à jour locale')
          return 'ERROR'
        }

        // 5. Succès Supabase : mise à jour locale uniquement
        const newAgent: Agent = {
          id: agentToBuy.id,
          name: agentToBuy.name,
          role: agentToBuy.role,
          status: 'Standby',
          currentTask: null,
          progress: 0,
        }
        const newLog: LogEntry = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          source: 'MARKET',
          message: `Allocation ${newAgent.name} (-${price} TK)`,
          type: 'success',
        }
        set({
          tokens: debitResult.newBalance,
          agents: [...state.agents, newAgent],
          logs: [newLog, ...state.logs].slice(0, 50),
        })
        get().addTransaction(price, 'DEBIT', `Recrutement ${newAgent.name}`)

        return 'SUCCESS'
      },

      recruitTeam: async (agentIds, totalCost) => {
        if (!agentIds?.length || totalCost < 0) {
          return { ok: false, error: 'Paramètres invalides (agents ou coût manquant).' }
        }
        const state = get()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          return { ok: false, error: 'Utilisateur non connecté.' }
        }
        try {
          const currentTreasury = await getTreasury(supabase, user.id)
          if (currentTreasury < totalCost) {
            return { ok: false, error: `Solde insuffisant (${currentTreasury} TK). Coût requis : ${totalCost} TK.` }
          }
          const debitResult = await debitTreasury(supabase, user.id, totalCost)
          if (!debitResult.ok) {
            return { ok: false, error: debitResult.error ?? 'Impossible de débiter le solde.' }
          }
          const restoredTreasury = debitResult.newBalance + totalCost
          const rollbackTreasury = async () => {
            const { error: rollback } = await supabase.from('user_balance').upsert(
              { user_id: user.id, treasury: restoredTreasury, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            )
            if (rollback) console.error('recruitTeam: Rollback treasury échoué', rollback.message)
          }
          const agentsToInsert = agentIds.map((id) => MARKET_CATALOG.find((a) => a.id === id)).filter((a): a is MarketAgent => !!a)
          if (agentsToInsert.length !== agentIds.length) {
            const unknown = agentIds.find((id) => !MARKET_CATALOG.some((a) => a.id === id))
            await rollbackTreasury()
            return { ok: false, error: `Agent inconnu dans le catalogue : ${unknown ?? '?'}.` }
          }
          const categoryToColor: Record<MarketCategory, string> = {
            MARKETING: 'pink',
            TECH: 'blue',
            SALES: 'green',
            ADMIN: 'slate',
            DATA: 'cyan',
            ELITE: 'yellow',
          }
          const { error: uaErr } = await supabase
            .from('user_agents')
            .insert(agentIds.map((id) => ({ user_id: user.id, agent_id: id })))
          if (uaErr) {
            await rollbackTreasury()
            const msg = uaErr.code === '23505'
              ? 'Un ou plusieurs de ces agents sont déjà dans votre équipe.'
              : (uaErr.message ?? 'Erreur lors de l’insertion user_agents.')
            return { ok: false, error: msg }
          }
          const { error: agentsErr } = await supabase.from('agents').insert(
            agentsToInsert.map((a) => ({
              user_id: user.id,
              name: a.name,
              role: a.role,
              status: 'idle',
              avatar_color: categoryToColor[a.category] || 'cyan',
              tasks_completed: 0,
              efficiency: 85,
            }))
          )
          if (agentsErr) {
            await rollbackTreasury()
            return { ok: false, error: agentsErr.message ?? 'Erreur lors de l’insertion agents.' }
          }
          const existingIds = new Set(state.agents.map((a) => a.id))
          const newAgents: Agent[] = agentsToInsert
            .filter((a) => !existingIds.has(a.id))
            .map((a) => ({
              id: a.id,
              name: a.name,
              role: a.role,
              status: 'Standby' as const,
              currentTask: null,
              progress: 0,
            }))
          const newLog: LogEntry = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: 'MARKET',
            message: `Équipe déployée (${newAgents.length} agent(s), -${totalCost} TK)`,
            type: 'success',
          }
          set({
            tokens: debitResult.newBalance,
            agents: [...state.agents, ...newAgents],
            logs: [newLog, ...state.logs].slice(0, 50),
          })
          get().addTransaction(totalCost, 'DEBIT', `Déploiement équipe (${newAgents.length} agent(s))`)
          return { ok: true }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erreur inconnue lors du déploiement.'
          return { ok: false, error: msg }
        }
      },

      terminateContract: (agentId) => {
        const state = get()
        const agent = state.agents.find((a) => a.id === agentId)
        if (!agent) return
        const newLog: LogEntry = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          source: 'MARKET',
          message: `Contrat terminé avec ${agent.name}`,
          type: 'info',
        }
        set({
          agents: state.agents.filter((a) => a.id !== agentId),
          logs: [newLog, ...state.logs].slice(0, 50),
        })
      },

      updateAgentDirective: (agentId, directive) => {
        const state = get()
        set({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, customDirective: directive, userDirectives: directive } : a
          ),
        })
      },

      updateAgentDirectives: (agentId, directives) => {
        const state = get()
        set({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, userDirectives: directives } : a
          ),
        })
      },

      reset: () => set({
        savedTime: 0,
        tokens: 0,
        treasuryLoading: true,
        logs: [],
        agents: [],
        transactions: [],
        completedMissions: [],
        missions: [],
        projects: [],
        activeProject: null,
        settings: INITIAL_SETTINGS,
        subscriptionTier: 'FREE',
      }),
}))
