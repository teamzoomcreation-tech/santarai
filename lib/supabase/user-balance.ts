/**
 * Gestion de la trésorerie utilisateur (table user_balance).
 * Utilisé par le Conductor pour le déploiement de missions.
 * Requiert que la migration 20250628_user_balance.sql soit exécutée.
 *
 * Upsert silencieux : si l'utilisateur n'a pas de ligne (nouveau, ex. Google OAuth),
 * on crée automatiquement la ligne avec 25 000 TK sans erreur console.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'

const DEFAULT_TREASURY = 25_000 // Freemium : solde initial nouveaux utilisateurs
const DEFAULT_PLAN: PlanTier = 'FREE'

// Tokens crédités à l'achat de chaque plan
export const PLAN_TOKENS: Record<PlanTier, number> = {
  FREE: 25_000,
  STARTER: 500_000,
  PRO: 2_500_000,
  ENTERPRISE: 15_000_000,
}

export async function getTreasury(supabase: SupabaseClient, userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("user_balance")
      .select("treasury")
      .eq("user_id", userId)
      .maybeSingle()

    if (!error && data) {
      return Number(data.treasury ?? DEFAULT_TREASURY)
    }

    // Nouvel utilisateur — créer la ligne avec le solde FREE
    const { error: upsertError } = await supabase
      .from("user_balance")
      .upsert(
        { user_id: userId, treasury: DEFAULT_TREASURY, plan: DEFAULT_PLAN, updated_at: new Date().toISOString() },
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

/**
 * Lit le plan d'abonnement actuel depuis user_balance.
 * Retourne 'FREE' si aucune ligne n'existe.
 */
export async function getPlan(supabase: SupabaseClient, userId: string): Promise<PlanTier> {
  try {
    const { data, error } = await supabase
      .from("user_balance")
      .select("plan")
      .eq("user_id", userId)
      .maybeSingle()

    if (!error && data && data.plan) {
      return data.plan as PlanTier
    }
    return DEFAULT_PLAN
  } catch {
    return DEFAULT_PLAN
  }
}

/**
 * Met à jour le plan d'abonnement ET crédite les tokens correspondants.
 * Utilisé UNIQUEMENT par le webhook Stripe (côté serveur, service role).
 * Gère gracieusement l'absence de la colonne plan (migration non encore appliquée).
 */
export async function setPlan(
  supabase: SupabaseClient,
  userId: string,
  plan: PlanTier,
  tokensToAdd: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const current = await getTreasury(supabase, userId)
    const newBalance = current + tokensToAdd

    // Tentative avec colonne plan (migration appliquée)
    const { error } = await supabase
      .from("user_balance")
      .upsert(
        {
          user_id: userId,
          treasury: newBalance,
          plan,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (error) {
      // Fallback : si la colonne plan n'existe pas encore (migration non appliquée)
      // on met quand même les tokens à jour
      if (error.message?.includes('plan') || error.code === '42703') {
        console.warn("[setPlan] Colonne plan manquante — mise à jour treasury uniquement. Appliquer la migration SQL.")
        const { error: fallbackError } = await supabase
          .from("user_balance")
          .upsert(
            { user_id: userId, treasury: newBalance, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          )
        if (fallbackError) {
          return { ok: false, error: fallbackError.message }
        }
        return { ok: true } // tokens crédités, plan non persisté
      }
      console.error("[setPlan] Erreur upsert user_balance:", error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err: any) {
    console.error("[setPlan] Exception:", err?.message ?? err)
    return { ok: false, error: err?.message ?? "Erreur inconnue" }
  }
}

export async function ensureAndGetTreasury(supabase: SupabaseClient, userId: string): Promise<number> {
  return getTreasury(supabase, userId)
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
