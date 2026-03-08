-- =============================================================================
-- SÉCURITÉ : Empêcher la création automatique de projets factices à l'inscription
-- =============================================================================
-- Ce script :
-- 1. Supprime tout trigger existant sur auth.users qui pourrait insérer des projets
-- 2. Crée un handler strict qui NE crée QUE user_balance (trésorerie initiale)
-- 3. Ne crée JAMAIS de projets, missions ou tâches pour les nouveaux utilisateurs
--
-- À exécuter dans Supabase SQL Editor ou via supabase db push
-- =============================================================================

-- Supprimer les triggers connus qui pourraient insérer des projets
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

-- Supprimer les fonctions obsolètes qui pourraient créer des projets
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;

-- Fonction SÉCURISÉE : crée UNIQUEMENT le solde user_balance (aucun projet)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Uniquement user_balance : trésorerie initiale 25 000 TK (Freemium)
  INSERT INTO public.user_balance (user_id, treasury)
  VALUES (NEW.id, 25000)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- AUCUNE insertion dans projects, missions ou tasks
  RETURN NEW;
END;
$$;

-- Trigger : appelé uniquement à la création d'un nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
