import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    // ── 1. Authentification obligatoire ─────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // ── 2. Validation du body ────────────────────────────────────────────────
    const { priceId, planName, tokensAmount } = await req.json()

    if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(planName)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const amount = Math.round(Number(priceId) * 100)
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''

    // ── 3. Création session Stripe avec metadata utilisateur ─────────────────
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `SANTARAI — Plan ${planName}`,
              description: `Recharge immédiate de ${Number(tokensAmount).toLocaleString()} Tokens.`,
              images: ['https://cdn-icons-png.flaticon.com/512/4712/4712035.png'],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Metadata sécurisée — le webhook Stripe l'utilise pour créditer le bon user
      metadata: {
        userId: user.id,
        planName,
        tokensAmount: String(tokensAmount),
      },
      success_url: `${origin}/dashboard?payment_pending=true`,
      cancel_url: `${origin}/dashboard/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('Erreur Stripe checkout:', err)
    const message = err instanceof Error ? err.message : 'Erreur lors de la création de la session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
