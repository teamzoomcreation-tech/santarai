-- Colonne is_read sur missions : pour acquitter les notifications (pastille) quand l'utilisateur ouvre le rapport.
-- Par défaut false : toute nouvelle mission/archive affiche la pastille jusqu'à ce qu'elle soit "vue".

ALTER TABLE missions
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN missions.is_read IS 'true une fois que l''utilisateur a ouvert la modale détail (œil) ; la pastille ne compte plus cette entrée.';

CREATE INDEX IF NOT EXISTS idx_missions_is_read ON missions(is_read);
