-- =============================================================================
-- Table user_balance : Trésorerie (TK) par utilisateur — source de vérité serveur
-- =============================================================================
-- Permet au Conductor de débiter lors du recrutement auto des agents.

CREATE TABLE IF NOT EXISTS user_balance (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  treasury INTEGER NOT NULL DEFAULT 500000 CHECK (treasury >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON user_balance(user_id);

-- RLS : l'utilisateur ne lit que son solde
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_balance_select_own"
  ON user_balance FOR SELECT
  USING (auth.uid() = user_id);

-- Pas de policy INSERT/UPDATE pour utilisateurs normaux — le service role (Conductor) bypass RLS

-- Fonction : créer ou récupérer le solde (500K par défaut = plan STARTER)
CREATE OR REPLACE FUNCTION ensure_user_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_treasury INTEGER;
BEGIN
  INSERT INTO user_balance (user_id, treasury)
  VALUES (p_user_id, 500000)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT treasury INTO v_treasury FROM user_balance WHERE user_id = p_user_id;
  RETURN v_treasury;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
