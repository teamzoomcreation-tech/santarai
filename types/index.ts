/**
 * Types SANTARAI ENTERPRISE — Projets > Missions > Tâches
 */

export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  progress: number
  dueDate?: string
  createdAt: string
  updatedAt?: string
}

export type TaskStatus = 'pending' | 'working' | 'done'

export type TaskOutputType = 'text' | 'code'

export interface Task {
  id: string
  missionId: string
  agentId: string
  title: string
  description?: string | null
  outputUrl: string | null
  output_content?: string | null
  output_type?: TaskOutputType | null
  status: TaskStatus
  createdAt: string
  updatedAt?: string
}

export type MissionStatus = 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'pending' | 'in_progress' | 'completed' | 'failed'

export interface Mission {
  id: string
  projectId: string | null
  agentId: string
  agentName: string
  title: string
  status: MissionStatus
  date: string
  cost: number
  resultSnippet?: string
  tasks?: Task[]
}

export interface Agent {
  id: string
  name: string
  role: string
  status: 'Standby' | 'Working' | 'Offline'
  currentTask: string | null
  progress: number
  userDirectives?: string
  customDirective?: string
}
