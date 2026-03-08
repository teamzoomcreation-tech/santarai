-- =============================================================================
-- SANTARAI ENTERPRISE — Schema hiérarchie Projets > Missions > Tâches
-- =============================================================================
-- À exécuter dans l’ordre (migrations Supabase ou SQL Editor).
-- Compatible avec auth.users pour RLS.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TABLE projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "projects_delete_own"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- -----------------------------------------------------------------------------
-- 2. TABLE missions (avec project_id nullable pour migration)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  agent_id TEXT,
  agent_name TEXT,
  cost INTEGER DEFAULT 0,
  result_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "missions_select_own"
  ON missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "missions_insert_own"
  ON missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "missions_update_own"
  ON missions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "missions_delete_own"
  ON missions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_project_id ON missions(project_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);

-- -----------------------------------------------------------------------------
-- 3. TABLE tasks (liées aux missions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  output_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'working', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: add description if table already existed without it
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
-- Image maquette / rendu visuel (logo, UI généré par l'IA)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS image_url TEXT;
-- Factory Mode : résultat généré par l'IA (texte ou code)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS output_content TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS output_type TEXT;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS via mission -> user (pas de user_id direct sur tasks)
CREATE POLICY "tasks_select_via_mission"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = tasks.mission_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_via_mission"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = tasks.mission_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_update_via_mission"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = tasks.mission_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks_delete_via_mission"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = tasks.mission_id AND m.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_tasks_mission_id ON tasks(mission_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- -----------------------------------------------------------------------------
-- Optionnel : table catalogue agents (pour seed Roster SANTARAI)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('MARKETING', 'TECH', 'SALES', 'ADMIN', 'ELITE', 'DATA')),
  tokens INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pas de RLS : catalogue global en lecture (ou selon politique métier)
ALTER TABLE agent_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_catalog_select_all"
  ON agent_catalog FOR SELECT
  USING (true);

CREATE POLICY "agent_catalog_insert_service"
  ON agent_catalog FOR INSERT
  WITH CHECK (true);

CREATE POLICY "agent_catalog_update_service"
  ON agent_catalog FOR UPDATE
  USING (true);
