import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { priceId, planName, tokensAmount } = await req.json()

    const origin = req.headers.get('origin') || ''
    const amount = Math.round(Number(priceId) * 100)
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `SANTARAI - Plan ${planName}`,
              description: `Recharge immédiate de ${Number(tokensAmount).toLocaleString()} Tokens.`,
              images: ['https://cdn-icons-png.flaticon.com/512/4712/4712035.png'],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard?payment_success=true&plan=${encodeURIComponent(planName)}&amount=${encodeURIComponent(tokensAmount)}`,
      cancel_url: `${origin}/dashboard/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('Erreur Stripe:', err)
    const message = err instanceof Error ? err.message : 'Erreur lors de la création de la session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
