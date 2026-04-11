/**
 * Webhook Stripe — Point d'entrée sécurisé pour les événements de paiement.
 *
 * Signature vérifiée avec STRIPE_WEBHOOK_SECRET.
 * Seul cet endpoint (côté serveur) est autorisé à créditer un compte utilisateur.
 *
 * Configurer dans Stripe Dashboard :
 *   Endpoint URL : https://www.santarai.com/api/stripe/webhook
 *   Événements : checkout.session.completed
 *
 * Variables d'environnement requises :
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET  (whsec_...)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { setPlan, type PlanTier } from '@/lib/supabase/user-balance'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PLAN_TOKENS: Record<string, number> = {
  STARTER: 500_000,
  PRO: 2_500_000,
  ENTERPRISE: 15_000_000,
}

// Client admin Supabase — bypass RLS pour créditer le user
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Variables Supabase manquantes')
  return createClient(url, key, { auth: { persistSession: false } })
}

// Désactiver le body parsing automatique — Stripe nécessite le raw body pour vérifier la signature
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET manquant')
    return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 })
  }

  // ── 1. Vérification signature Stripe ──────────────────────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // ── 2. Traitement des événements ──────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Récupérer les métadonnées transmises lors du checkout
    const userId = session.metadata?.userId
    const planName = session.metadata?.planName as PlanTier | undefined
    const tokensAmount = parseInt(session.metadata?.tokensAmount ?? '0', 10)

    if (!userId || !planName || !tokensAmount) {
      console.error('[stripe/webhook] Metadata manquante:', session.metadata)
      return NextResponse.json({ error: 'Metadata incomplète' }, { status: 400 })
    }

    if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(planName)) {
      console.error('[stripe/webhook] Plan invalide:', planName)
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const expectedTokens = PLAN_TOKENS[planName]
    if (tokensAmount !== expectedTokens) {
      console.error('[stripe/webhook] Tokens ne correspondent pas au plan:', { planName, tokensAmount, expectedTokens })
      // Sécurité : utiliser les tokens du plan attendu, jamais ceux fournis par le client
    }

    // ── 3. Créditer le compte en base (service role, bypass RLS) ────────────
    try {
      const adminSupabase = getAdminClient()
      const result = await setPlan(adminSupabase, userId, planName, expectedTokens)

      if (!result.ok) {
        console.error('[stripe/webhook] Erreur setPlan:', result.error)
        return NextResponse.json({ error: 'Erreur mise à jour plan' }, { status: 500 })
      }

      console.info(`[stripe/webhook] Plan ${planName} activé pour user ${userId} (+${expectedTokens} TK)`)
    } catch (err) {
      console.error('[stripe/webhook] Exception setPlan:', err)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
