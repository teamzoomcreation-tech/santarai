-- Migration : ajout de la colonne plan à user_balance
-- Exécuter dans Supabase SQL Editor

-- 1. Ajout de la colonne plan avec valeur par défaut FREE
ALTER TABLE user_balance
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'FREE'
    CHECK (plan IN ('FREE', 'STARTER', 'PRO', 'ENTERPRISE'));

-- 2. Mettre à jour les utilisateurs existants qui ont plus de 25 000 tokens
--    (ils avaient probablement déjà payé, on les met en STARTER au minimum)
UPDATE user_balance
  SET plan = CASE
    WHEN treasury >= 15000000 THEN 'ENTERPRISE'
    WHEN treasury >= 2500000  THEN 'PRO'
    WHEN treasury >= 500000   THEN 'STARTER'
    ELSE 'FREE'
  END
WHERE plan = 'FREE';

-- 3. Mettre à jour le trigger pour créer les nouveaux utilisateurs en FREE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_balance (user_id, treasury, plan, updated_at)
  VALUES (NEW.id, 25000, 'FREE', NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
