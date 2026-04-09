import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Proxy Webhook sécurisé — Relais serveur vers outils externes (Zapier, Make, Slack…)
 * Protégé : auth Supabase requise + blocklist SSRF + https uniquement
 */

const SSRF_BLOCKLIST = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/::1/,
  /^https?:\/\/\[::1\]/,
  /^https?:\/\/metadata\./i,
  /^https?:\/\/\[fd[0-9a-f]{2}:/i,
]

export async function POST(req: Request) {
  // ── Authentification : seul un user connecté peut utiliser ce proxy ──
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { webhookUrl, payload } = body

    if (!webhookUrl || typeof webhookUrl !== "string") {
      return NextResponse.json({ error: "webhookUrl requis" }, { status: 400 })
    }

    const url = webhookUrl.trim()

    // ── HTTPS obligatoire ──
    if (!url.startsWith("https://")) {
      return NextResponse.json(
        { error: "L'URL doit commencer par https://" },
        { status: 400 }
      )
    }

    // ── Blocklist SSRF : interdit les IP internes / metadata ──
    if (SSRF_BLOCKLIST.some((pattern) => pattern.test(url))) {
      return NextResponse.json({ error: "URL non autorisée" }, { status: 403 })
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      return NextResponse.json(
        { error: text || "Erreur du webhook distant" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Délai d'attente dépassé (10s)" }, { status: 504 })
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    )
  }
}
