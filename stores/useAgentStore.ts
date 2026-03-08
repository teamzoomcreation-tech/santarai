import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { MARKET_AGENTS, Agent } from '@/data/marketAgents'

export interface Task {
  id: string
  title: string
  status: 'todo' | 'progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignedTo: string
  result?: string
  progress?: number
  created_at?: string
}

interface AgentStore {
  // STATE PRINCIPAL : Catalogue vs Agents Recrutés
  agents: Agent[] // Catalogue complet (initialisé avec MARKET_AGENTS, JAMAIS d'appel API)
  userAgents: Agent[] // UNIQUEMENT les agents recrutés par l'utilisateur (depuis Supabase)
  isLoading: boolean // État de chargement
  
  tasks: Task[]
  logs: string[]
  systemLogs: any[]
  budget: number
  selectedAgent: Agent | null
  userSettings: {
    companyName?: string
    apiKey?: string
    language?: string
  }
  
  // ACTIONS PRINCIPALES
  fetchUserAgents: () => Promise<void> // Charge les agent_id depuis user_agents uniquement
  recruitAgent: (agentId: string) => Promise<void> // Recrute un agent (insert dans user_agents)
  removeAgent: (agentId: string) => Promise<void> // Supprime un agent recruté
  
  // ALIAS pour compatibilité
  fetchAgents: () => Promise<void>
  loadUserRecruitments: () => Promise<void>
  addAgent: (agent: any) => Promise<void>
  
  // AUTRES FONCTIONS
  fetchTasks: () => Promise<void>
  tickBudget: () => void
  addXp: (id: string, amount: number) => Promise<void>
  spendCredits: (amount: number) => Promise<boolean>
  assignTask: (agentId: string | null | undefined, title: string, priority: any) => Promise<void>
  updateTaskStatus: (taskId: string, status: any) => Promise<void>
  completeTask: (taskId: string) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  updateAgent: (id: string, data: any) => Promise<void>
  updateSettings: (settings: { companyName?: string; apiKey?: string; language?: string }) => void
  addLog: (message: string) => void
  setSelectedAgent: (agent: Agent | null) => void
  isChatOpen: boolean
  setChatOpen: (open: boolean) => void
  initialChatMessage: string | null
  setInitialChatMessage: (msg: string | null) => void
  /** ID de l'agent dont le chat est en cours de génération (pour VFX 3D) */
  generatingAgentId: string | null
  setGeneratingAgentId: (id: string | null) => void
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  // STATE INITIAL : agents initialisé directement avec MARKET_AGENTS (LOCAL)
  agents: MARKET_AGENTS || [],
  userAgents: [],
  isLoading: false,
  
  tasks: [],
  logs: [],
  systemLogs: [],
  budget: 0,
  selectedAgent: null,
  isChatOpen: false,
  initialChatMessage: null,
  generatingAgentId: null,
  userSettings: {
    companyName: "",
    apiKey: "",
    language: ""
  },

  // ACTION PRINCIPALE : Charge les agent_id depuis user_agents et met à jour userAgents
  fetchUserAgents: async () => {
    set({ isLoading: true })
    
    try {
      if (!supabase) {
        console.warn("⚠️ fetchUserAgents: Supabase client indisponible")
        set({ isLoading: false, userAgents: [] })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Pas d'utilisateur connecté : aucun agent recruté
        set({ isLoading: false, userAgents: [] })
        return
      }

      // APPEL SUPABASE STRICT : Récupérer UNIQUEMENT les agent_id depuis user_agents
      // JAMAIS d'appel à la table 'agents' (public.agents)
      const { data, error } = await supabase
        .from('user_agents')
        .select('agent_id')
        .eq('user_id', user.id)

      if (error) {
        // Si la table n'existe pas ou erreur, log mais ne crash pas
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn("⚠️ Table user_agents n'existe pas encore. Créez-la avec : CREATE TABLE user_agents (user_id UUID, agent_id TEXT, PRIMARY KEY (user_id, agent_id));")
        } else {
          console.warn("⚠️ fetchUserAgents: Erreur Supabase:", error.message)
        }
        set({ isLoading: false, userAgents: [] })
        return
      }

      // Extraire les IDs et filtrer le catalogue local
      const ownedIds = (data || []).map((d: any) => d.agent_id).filter(Boolean)
      const myAgents = MARKET_AGENTS.filter(agent => ownedIds.includes(agent.id))
        .map(agent => ({
          ...agent,
          status: 'idle' as const,
          avatar: { color: 'cyan' },
          tasksCompleted: 0,
          efficiency: 85,
          isRecruited: true,
        }))

      set({ 
        isLoading: false,
        userAgents: myAgents
      })
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        set({ isLoading: false })
        return
      }
      console.error("🦁 fetchUserAgents:", e?.message || e)
      set({ isLoading: false, userAgents: [] })
    }
  },

  // ACTION PRINCIPALE : Recrute un agent (insert dans user_agents)
  recruitAgent: async (agentId: string) => {
    const previousUserAgents = [...get().userAgents]
    
    try {
      if (!agentId) {
        throw new Error("L'ID de l'agent est requis")
      }

      // Trouver l'agent dans le catalogue
      const agentToRecruit = MARKET_AGENTS.find(a => a.id === agentId)
      if (!agentToRecruit) {
        throw new Error(`Agent avec l'ID "${agentId}" introuvable dans le catalogue`)
      }

      // Vérifier si déjà recruté localement
      const isAlreadyRecruited = get().userAgents.some(a => a.id === agentId)
      if (isAlreadyRecruited) {
        console.warn(`⚠️ L'agent ${agentId} est déjà recruté (local)`)
        return
      }

      // OPTIMISTIC UI : Ajouter immédiatement au state local
      const newUserAgent = {
        ...agentToRecruit,
        status: 'idle' as const,
        avatar: { color: 'cyan' },
        tasksCompleted: 0,
        efficiency: 85,
        isRecruited: true,
      }

      set((state) => ({
        userAgents: [...state.userAgents, newUserAgent]
      }))

      // ENSUITE : Insérer dans Supabase (user_agents uniquement)
      if (!supabase) {
        set({ userAgents: previousUserAgents })
        throw new Error("Supabase client indisponible")
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ userAgents: previousUserAgents })
        throw new Error("Vous devez être connecté pour recruter un agent")
      }

      // APPEL SUPABASE STRICT : Insert UNIQUEMENT dans user_agents
      const { error: insertError } = await supabase
        .from('user_agents')
        .insert({
          user_id: user.id,
          agent_id: agentId,
        })

      if (insertError) {
        // GESTION D'ERREUR INTELLIGENTE : Duplicate key = SUCCÈS
        if (insertError.code === '23505') {
          // L'utilisateur a déjà cet agent : considérer comme succès
          // Garder la mise à jour optimiste (c'est correct)
          const ts = new Date().toISOString().slice(11, 19)
          set((state) => ({
            logs: [`[${ts}] Agent "${agentToRecruit.name}" déjà recruté`, ...(state.logs || [])].slice(0, 50)
          }))
          return
        }

        // ROLLBACK : Annuler le changement visuel si autre erreur
        set({ userAgents: previousUserAgents })
        
        if (insertError.code === 'PGRST116' || insertError.message?.includes('does not exist')) {
          throw new Error("Table user_agents n'existe pas. Créez-la avec : CREATE TABLE user_agents (user_id UUID, agent_id TEXT, PRIMARY KEY (user_id, agent_id));")
        }
        
        throw new Error(`Erreur lors du recrutement : ${insertError.message || 'Erreur inconnue'}`)
      }

      // Succès : Log et garder la mise à jour optimiste
      const ts = new Date().toISOString().slice(11, 19)
      set((state) => ({
        logs: [`[${ts}] Agent "${agentToRecruit.name}" recruté`, ...(state.logs || [])].slice(0, 50)
      }))
    } catch (e: any) {
      // ROLLBACK en cas d'erreur générale
      set({ userAgents: previousUserAgents })
      
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        return
      }
      console.error("🦁 recruitAgent:", e?.message || e)
      throw e
    }
  },

  // ACTION PRINCIPALE : Supprime un agent recruté (delete dans user_agents)
  removeAgent: async (agentId: string) => {
    const previousUserAgents = [...get().userAgents]
    
    try {
      if (!agentId) {
        throw new Error("L'ID de l'agent est requis")
      }

      // OPTIMISTIC UI : Retirer immédiatement du state local
      set((state) => ({
        userAgents: state.userAgents.filter(a => a.id !== agentId)
      }))

      // ENSUITE : Supprimer de Supabase (user_agents uniquement)
      if (!supabase) {
        set({ userAgents: previousUserAgents })
        throw new Error("Supabase client indisponible")
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ userAgents: previousUserAgents })
        throw new Error("Vous devez être connecté pour supprimer un agent")
      }

      // APPEL SUPABASE STRICT : Delete UNIQUEMENT depuis user_agents
      const { error: deleteError } = await supabase
        .from('user_agents')
        .delete()
        .match({ user_id: user.id, agent_id: agentId })

      if (deleteError) {
        // ROLLBACK : Annuler le changement visuel si Supabase échoue
        set({ userAgents: previousUserAgents })
        
        if (deleteError.code === 'PGRST116' || deleteError.message?.includes('does not exist')) {
          throw new Error("Table user_agents n'existe pas. Créez-la avec : CREATE TABLE user_agents (user_id UUID, agent_id TEXT, PRIMARY KEY (user_id, agent_id));")
        }
        
        throw new Error(`Erreur lors de la suppression : ${deleteError.message || 'Erreur inconnue'}`)
      }

      // Succès : Log et garder la mise à jour optimiste
      const agentToRemove = previousUserAgents.find(a => a.id === agentId)
      const ts = new Date().toISOString().slice(11, 19)
      set((state) => ({
        logs: [`[${ts}] Agent "${agentToRemove?.name || agentId}" retiré`, ...(state.logs || [])].slice(0, 50)
      }))
    } catch (e: any) {
      // ROLLBACK en cas d'erreur générale
      set({ userAgents: previousUserAgents })
      
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        return
      }
      console.error("🦁 removeAgent:", e?.message || e)
      throw e
    }
  },

  // ALIAS pour compatibilité
  fetchAgents: async () => {
    await get().fetchUserAgents()
  },

  loadUserRecruitments: async () => {
    await get().fetchUserAgents()
  },

  addAgent: async (agent: any) => {
    const agentId = agent?.id || agent?.name
    if (!agentId) {
      throw new Error("L'agent doit avoir un ID ou un nom")
    }
    await get().recruitAgent(agentId)
  },

  // AUTRES FONCTIONS (inchangées)
  tickBudget: () => {},
  addXp: async () => {},
  spendCredits: async () => true,

  assignTask: async (agentId: string | null | undefined, title: string, priority: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("🦁 assignTask: Pas d'utilisateur connecté")
        return
      }

      const status = 'pending'
      const agentIdVal = (agentId != null && String(agentId).trim() !== '') ? agentId : null

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          agent_id: agentIdVal,
          title,
          status,
          priority: priority || 'medium',
        }])
        .select()
        .single()

      if (error) {
        console.error("🦁 ERREUR assignTask:", JSON.stringify(error, null, 2))
        throw error
      }

      const newTask: Task = {
        id: data.id,
        title: data.title,
        status: 'todo',
        priority: (data.priority || 'medium') as 'low' | 'medium' | 'high',
        assignedTo: data.agent_id || '',
        result: data.result || undefined,
        created_at: data.created_at
      }

      const ts = new Date().toISOString().slice(11, 19)
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        logs: [`[${ts}] Mission "${data.title}" assignée`, ...(state.logs || [])].slice(0, 50)
      }))
    } catch (error: any) {
      throw error
    }
  },

  updateTaskStatus: async (taskId: string, status: any) => {
    try {
      let supabaseStatus = 'pending'
      if (status === 'progress') supabaseStatus = 'in-progress'
      else if (status === 'done') supabaseStatus = 'done'
      else if (status === 'todo') supabaseStatus = 'pending'

      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: supabaseStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      let mappedStatus: 'todo' | 'progress' | 'done' = 'todo'
      if (data.status === 'pending') mappedStatus = 'todo'
      else if (data.status === 'in-progress') mappedStatus = 'progress'
      else if (data.status === 'done') mappedStatus = 'done'

      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === taskId 
            ? { ...t, status: mappedStatus }
            : t
        )
      }))
    } catch (error: any) {
      throw error
    }
  },

  completeTask: async (taskId: string) => {
    try {
      const fakeResult = "Mission terminée avec succès"
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: 'done',
          result: fakeResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === taskId 
            ? { ...t, status: 'done' as const, result: fakeResult }
            : t
        )
      }))
    } catch (error: any) {
      throw error
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      const ts = new Date().toISOString().slice(11, 19)
      set((state) => {
        const t = state.tasks.find(x => x.id === taskId)
        return {
          tasks: state.tasks.filter(x => x.id !== taskId),
          logs: [`[${ts}] Mission "${t?.title || taskId}" supprimée`, ...(state.logs || [])].slice(0, 50)
        }
      })
    } catch (error: any) {
      throw error
    }
  },

  updateAgent: async () => {},
  
  updateSettings: (settings) => {
    set((state) => ({
      userSettings: { ...state.userSettings, ...settings }
    }))
  },
  
  addLog: (message) => {
    set((state) => ({
      systemLogs: [...(state.systemLogs || []), { message, timestamp: new Date() }]
    }))
  },
  
  setSelectedAgent: (agent) => {
    set({ selectedAgent: agent })
  },
  setChatOpen: (open) => {
    set({ isChatOpen: open })
  },
  setInitialChatMessage: (msg) => {
    set({ initialChatMessage: msg })
  },
  setGeneratingAgentId: (id) => {
    set({ generatingAgentId: id })
  },

  fetchTasks: async () => {
    try {
      if (!supabase) return

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        set({ tasks: [] })
        return
      }
      
      // Table tasks : pas de colonne user_id (hiérarchie tasks -> missions -> projects -> user).
      // On s'appuie sur les politiques RLS pour filtrer les tâches de l'utilisateur.
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return

      const formattedTasks: Task[] = (data || []).map((t: any) => {
        let status: 'todo' | 'progress' | 'done' = 'todo';
        if (t.status === 'pending') status = 'todo';
        else if (t.status === 'in-progress') status = 'progress';
        else if (t.status === 'done') status = 'done';
        
        return {
          id: t.id,
          title: t.title,
          status,
          priority: 'medium' as const,
          assignedTo: t.agent_id || '',
          result: t.result || undefined,
          created_at: t.created_at
        };
      });

      set({ tasks: formattedTasks });

    } catch {
      // Erreur silencieuse en production
    }
  }
}))
