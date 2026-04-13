/**
 * Script de migration Supabase — ajoute la colonne `plan` à user_balance.
 *
 * USAGE :
 *   node scripts/migrate-supabase.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Obtenir le token :
 *   1. Aller sur https://supabase.com/dashboard/account/tokens
 *   2. Cliquer "Generate new token"
 *   3. Copier le token
 *   4. Lancer : node scripts/migrate-supabase.mjs sbp_xxxxxxxxxxxx
 */

const PROJECT_REF = 'xvtszchjaezonzemjfjl'
const ACCESS_TOKEN = process.argv[2]

if (!ACCESS_TOKEN || !ACCESS_TOKEN.startsWith('sbp_')) {
  console.error('❌ Token manquant ou invalide.')
  console.error('')
  console.error('USAGE: node scripts/migrate-supabase.mjs <SUPABASE_ACCESS_TOKEN>')
  console.error('')
  console.error('Obtenir votre token :')
  console.error('  → https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const MIGRATIONS = [
  {
    name: 'Ajouter colonne plan à user_balance',
    sql: `ALTER TABLE user_balance ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'STARTER', 'PRO', 'ENTERPRISE'));`,
  },
  {
    name: 'Mettre à jour le plan des utilisateurs existants selon leur solde',
    sql: `UPDATE user_balance SET plan = CASE WHEN treasury >= 15000000 THEN 'ENTERPRISE' WHEN treasury >= 2500000 THEN 'PRO' WHEN treasury >= 500000 THEN 'STARTER' ELSE 'FREE' END WHERE plan = 'FREE';`,
  },
  {
    name: 'Mettre à jour la fonction handle_new_user pour inclure plan=FREE',
    sql: `CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO user_balance (user_id, treasury, plan, updated_at) VALUES (NEW.id, 25000, 'FREE', NOW()) ON CONFLICT (user_id) DO NOTHING; RETURN NEW; END; $$;`,
  },
]

async function runMigration(sql, name) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const body = await res.json()
  if (!res.ok) {
    throw new Error(body.message || JSON.stringify(body))
  }
  return body
}

console.log('🚀 Migration Supabase — SantarAI\n')

for (const migration of MIGRATIONS) {
  process.stdout.write(`  ⏳ ${migration.name}... `)
  try {
    await runMigration(migration.sql, migration.name)
    console.log('✅ OK')
  } catch (err) {
    if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
      console.log('✅ Déjà fait')
    } else {
      console.log(`❌ ERREUR: ${err.message}`)
    }
  }
}

console.log('\n✅ Migration terminée ! Vos abonnements sont maintenant persistés en base.')
