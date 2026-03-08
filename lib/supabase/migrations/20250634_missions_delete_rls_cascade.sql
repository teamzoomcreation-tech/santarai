-- =============================================================================
-- Migration : RLS DELETE sur missions + CASCADE sur tasks
-- À exécuter dans Supabase SQL Editor.
-- Garantit que l'utilisateur authentifié peut supprimer ses missions et que
-- les tâches liées sont supprimées automatiquement.
-- =============================================================================

-- 1. Politique RLS DELETE pour missions (auth.uid() = user_id)
DROP POLICY IF EXISTS "missions_delete_own" ON missions;
CREATE POLICY "missions_delete_own"
  ON missions FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Clé étrangère tasks.mission_id : forcer ON DELETE CASCADE
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_mission_id_fkey;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_mission_id_fkey
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE;
