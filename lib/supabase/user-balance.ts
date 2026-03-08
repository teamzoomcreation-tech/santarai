/**
 * Gestion de la trésorerie utilisateur (table user_balance).
 * Utilisé par le Conductor pour le déploiement de missions.
 * Requiert que la migration 20250628_user_balance.sql soit exécutée.
 *
 * Upsert silencieux : si l'utilisateur n'a pas de ligne (nouveau, ex. Google OAuth),
 * on crée automatiquement la ligne avec 25 000 TK sans erreur console.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_TREASURY = 25_000 // Freemium : solde initial nouveaux utilisateurs

export async function getTreasury(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    // .maybeSingle() : 0 rows → { data: null, error: null } (pas d'erreur PGRST116)
    const { data, error } = await supabase
      .from("user_balance")
      .select("treasury")
      .eq("user_id", userId)
      .maybeSingle()

    if (!error && data) {
      return Number(data.treasury ?? DEFAULT_TREASURY)
    }

    // Pas de ligne (nouvel utilisateur) ou erreur → créer la ligne et retourner le solde Freemium
    const { error: upsertError } = await supabase
      .from("user_balance")
      .upsert(
        { user_id: userId, treasury: DEFAULT_TREASURY, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )

    if (upsertError) {
      console.error("[getTreasury] Upsert user_balance échoué:", {
        code: upsertError.code,
        message: upsertError.message,
        userId,
      })
    }
    return DEFAULT_TREASURY
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[getTreasury] Exception:", msg)
    return DEFAULT_TREASURY
  }
}

export async function ensureAndGetTreasury(supabase: SupabaseClient, userId: string): Promise<number> {
  const treasury = await getTreasury(supabase, userId)
  return treasury
}

export async function debitTreasury(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<{ ok: boolean; newBalance: number; error?: string }> {
  try {
    const current = await getTreasury(supabase, userId)
    const newBalance = Math.max(0, current - amount)

    if (current < amount) {
      console.error("[debitTreasury] Fonds insuffisants:", { current, amount, userId })
      return { ok: false, newBalance: current, error: "Fonds insuffisants" }
    }

    const { error } = await supabase
      .from("user_balance")
      .upsert(
        { user_id: userId, treasury: newBalance, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )

    if (error) {
      console.error("[debitTreasury] Erreur upsert user_balance:", {
        error: error.message,
        code: error.code,
        details: error.details,
        userId,
        newBalance,
      })
      return { ok: false, newBalance: current, error: error.message }
    }
    return { ok: true, newBalance }
  } catch (err: any) {
    console.error("[debitTreasury] Exception:", err?.message ?? err)
    return { ok: false, newBalance: 0, error: err?.message ?? "Erreur inconnue" }
  }
}
