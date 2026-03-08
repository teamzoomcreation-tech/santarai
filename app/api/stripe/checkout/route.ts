import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
})

// Mapping des plans vers les Price IDs Stripe
// IMPORTANT: Remplacez ces IDs par vos vrais Price IDs depuis votre dashboard Stripe
const PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_ID_PRO || "price_pro_placeholder",
  enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_enterprise_placeholder",
}

export async function POST(request: NextRequest) {
  try {
    const { planId, userEmail } = await request.json()

    if (!planId || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields: planId, userEmail" },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY not configured" },
        { status: 500 }
      )
    }

    const priceId = PRICE_IDS[planId]

    if (!priceId) {
      return NextResponse.json(
        { error: `Invalid plan ID: ${planId}` },
        { status: 400 }
      )
    }

    // Récupérer l'origine pour les URLs de retour
    const origin = request.headers.get("origin") || request.nextUrl.origin

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        planId: planId,
        userEmail: userEmail,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Erreur Stripe Checkout:", error)
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    )
  }
}
