-- =============================================================================
-- SANTARAI ENTERPRISE — Seed Roster (Upsert par id)
-- =============================================================================
-- Exécuter après schema.sql. Utilise agent_catalog (id, name, role, category, tokens).
-- =============================================================================

-- Marketing
INSERT INTO agent_catalog (id, name, role, category, tokens, description)
VALUES
  ('ghost', 'GHOST', 'Ghostwriter', 'MARKETING', 5000, 'Expert rédaction invisible. Écrit sans être vu.'),
  ('akira', 'AKIRA', 'Video Scripter', 'MARKETING', 4500, 'Scripts vidéo rapides et explosifs (TikTok).'),
  ('radar', 'RADAR', 'SEO', 'MARKETING', 4000, 'Détecte les opportunités et te place n°1.'),
  ('katana', 'KATANA', 'Twitter', 'MARKETING', 4000, 'Sniping Twitter. Des phrases qui tranchent.'),
  ('kaiju', 'KAIJU', 'Newsletter', 'MARKETING', 4500, 'Un monstre de contenu qui prend toute la place.'),
  ('pixel', 'PIXEL', 'Designer', 'MARKETING', 4000, 'Image, logo, design visuel. Créations qui marquent.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  category = EXCLUDED.category,
  tokens = EXCLUDED.tokens,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Tech
INSERT INTO agent_catalog (id, name, role, category, tokens, description)
VALUES
  ('mecha', 'MECHA', 'Debugger', 'TECH', 4000, 'Machine de guerre qui répare les erreurs.'),
  ('oracle', 'ORACLE', 'SQL', 'TECH', 6000, 'Source de vérité. Parle à la Data.'),
  ('ninja', 'NINJA', 'Backend', 'TECH', 5000, 'Trie les données à la vitesse de l''éclair.'),
  ('sensei', 'SENSEI', 'Docs', 'TECH', 3500, 'Celui qui enseigne et rend le code clair.'),
  ('python', 'PYTHON', 'Script', 'TECH', 2500, 'Automatisation de scripts et API.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  category = EXCLUDED.category,
  tokens = EXCLUDED.tokens,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Sales
INSERT INTO agent_catalog (id, name, role, category, tokens, description)
VALUES
  ('ronin', 'RONIN', 'Hunter', 'SALES', 3500, 'Samouraï solitaire qui chasse les prospects.'),
  ('viper', 'VIPER', 'Nego', 'SALES', 3500, 'Closing agressif et négociation rapide.'),
  ('sumo', 'SUMO', 'Closer', 'SALES', 4000, 'Objection Killer. Inamovible face aux refus.'),
  ('shogun', 'SHOGUN', 'Strat', 'SALES', 5500, 'Général qui définit la stratégie de l''offre.'),
  ('yakuza', 'YAKUZA', 'Retention', 'SALES', 5000, 'Email Sequencer. Ne lâche jamais le client.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  category = EXCLUDED.category,
  tokens = EXCLUDED.tokens,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Admin
INSERT INTO agent_catalog (id, name, role, category, tokens, description)
VALUES
  ('zen', 'ZEN', 'Support', 'ADMIN', 2000, 'Reste calme et poli face au chaos des emails.'),
  ('haiku', 'HAIKU', 'Summary', 'ADMIN', 2500, 'Résume 1h de blabla en 3 lignes.'),
  ('babel', 'BABEL', 'Trans', 'ADMIN', 3000, 'Brise la barrière de la langue.'),
  ('abacus', 'ABACUS', 'Compta', 'ADMIN', 3000, 'Excel Pro. Le boulier millénaire.'),
  ('kami', 'KAMI', 'Analyst', 'ADMIN', 7000, 'KPI Extractor. L''esprit supérieur.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  category = EXCLUDED.category,
  tokens = EXCLUDED.tokens,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Elite
INSERT INTO agent_catalog (id, name, role, category, tokens, description)
VALUES
  ('kage', 'KAGE', 'Clone', 'ELITE', 10000, 'Ton ombre. Agit comme toi quand tu n''es pas là.'),
  ('daimyo', 'DAIMYO', 'Legal', 'ELITE', 9000, 'Seigneur féodal qui connaît la Loi.'),
  ('watchtower', 'WATCHTOWER', 'Spy', 'ELITE', 8500, 'Tour de garde qui surveille le marché.'),
  ('crisis', 'CRISIS', 'Mgmt', 'ELITE', 12000, 'Plan d''action immédiat pour éteindre le feu.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  category = EXCLUDED.category,
  tokens = EXCLUDED.tokens,
  description = EXCLUDED.description,
  updated_at = NOW();
