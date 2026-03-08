-- =============================================================================
-- Migration : garantir type TEXT pour colonnes de contenu long (rapports, livrables)
-- À exécuter dans Supabase SQL Editor si les colonnes sont en VARCHAR(n).
-- Idempotent : si déjà en TEXT, ALTER COLUMN ... TYPE TEXT ne modifie rien.
-- =============================================================================

-- Table tasks : livrables et descriptions peuvent faire plusieurs pages
ALTER TABLE tasks ALTER COLUMN description TYPE TEXT;
ALTER TABLE tasks ALTER COLUMN output_content TYPE TEXT;

-- Table missions : result_snippet (résumé/synthèse mission) sans limite
ALTER TABLE missions ALTER COLUMN result_snippet TYPE TEXT;

-- Table missions : result_summary si la colonne existe (alias ou ancien schéma)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'result_summary'
  ) THEN
    ALTER TABLE missions ALTER COLUMN result_summary TYPE TEXT;
  END IF;
END $$;
