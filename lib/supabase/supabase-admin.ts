import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Client Supabase avec la clé SERVICE ROLE.
 * Bypass RLS — à utiliser UNIQUEMENT côté serveur (API routes, server components).
 * Ne jamais exposer cette clé au client.
 */
function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY"
    )
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

let _admin: SupabaseClient | null = null

/** Client admin singleton (côté serveur uniquement). */
export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = getSupabaseAdmin()
  }
  return _admin
}
