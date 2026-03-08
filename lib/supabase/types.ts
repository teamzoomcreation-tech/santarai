export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          role: string
          status: "active" | "thinking" | "idle"
          avatar_color: string
          tasks_completed: number
          efficiency: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          role: string
          status?: "active" | "thinking" | "idle"
          avatar_color: string
          tasks_completed?: number
          efficiency?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          role?: string
          status?: "active" | "thinking" | "idle"
          avatar_color?: string
          tasks_completed?: number
          efficiency?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          progress: number
          due_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          progress?: number
          due_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          progress?: number
          due_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_agents: {
        Row: {
          id: string
          project_id: string
          agent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          agent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          agent_id?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string
          due_date: string
          tag: string
          tag_color: string
          status: "todo" | "inprogress" | "done"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description: string
          due_date: string
          tag: string
          tag_color: string
          status?: "todo" | "inprogress" | "done"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string
          due_date?: string
          tag?: string
          tag_color?: string
          status?: "todo" | "inprogress" | "done"
          created_at?: string
          updated_at?: string
        }
      }
      task_agents: {
        Row: {
          id: string
          task_id: string
          agent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          agent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          agent_id?: string
          created_at?: string
        }
      }
    }
  }
}
