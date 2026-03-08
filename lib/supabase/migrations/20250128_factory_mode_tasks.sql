-- Factory Mode : colonnes output_content et output_type pour les tâches
-- Exécuter dans Supabase SQL Editor si les colonnes n'existent pas encore.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS output_content TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS output_type TEXT;

-- Optionnel : contrainte pour output_type (décommenter si souhaité)
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_output_type_check;
-- ALTER TABLE tasks ADD CONSTRAINT tasks_output_type_check CHECK (output_type IS NULL OR output_type IN ('text', 'code'));
