-- =============================================================================
-- RLS : Autoriser l'utilisateur à débiter son propre solde (Recrutement client)
-- =============================================================================
-- Le client doit pouvoir effectuer un UPSERT sur user_balance pour son user_id
-- lors du recrutement d'un agent (débit des TK).

CREATE POLICY "user_balance_insert_own"
  ON user_balance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_balance_update_own"
  ON user_balance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
