import { NextResponse } from "next/server"

/**
 * Proxy Webhook - Relais serveur pour contourner CORS.
 * Reçoit { webhookUrl, payload } du frontend et transmet la requête au webhook externe.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { webhookUrl, payload } = body

    if (!webhookUrl || typeof webhookUrl !== "string") {
      return NextResponse.json({ error: "webhookUrl requis" }, { status: 400 })
    }

    const url = webhookUrl.trim()
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return NextResponse.json(
        { error: "L'URL doit commencer par http:// ou https://" },
        { status: 400 }
      )
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text || res.statusText || "Erreur du webhook distant" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[webhook] Erreur:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    )
  }
}
