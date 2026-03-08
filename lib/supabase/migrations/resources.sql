-- =============================================================================
-- RESSOURCES (Mémoire de l'entreprise) - Module Knowledge Base
-- =============================================================================
-- Exécuter dans Supabase SQL Editor.
-- Créer le bucket "company_docs" dans Storage avec policy RLS (auth.uid() = owner).
-- =============================================================================

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  size INTEGER DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resources_select_own"
  ON resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "resources_insert_own"
  ON resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resources_update_own"
  ON resources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "resources_delete_own"
  ON resources FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
