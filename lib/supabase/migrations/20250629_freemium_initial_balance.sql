-- =============================================================================
-- Freemium : solde initial 25 000 TK pour les nouveaux utilisateurs
-- =============================================================================

ALTER TABLE user_balance
  ALTER COLUMN treasury SET DEFAULT 25000;

CREATE OR REPLACE FUNCTION ensure_user_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_treasury INTEGER;
BEGIN
  INSERT INTO user_balance (user_id, treasury)
  VALUES (p_user_id, 25000)
  ON CONFLICT (user_id) DO NOTHING;
  
  SELECT treasury INTO v_treasury FROM user_balance WHERE user_id = p_user_id;
  RETURN v_treasury;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
