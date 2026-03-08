import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Route de callback OAuth pour Supabase (Google, etc.).
 * Échange le code d'authentification contre une session et redirige vers le dashboard.
 * Le code_verifier (PKCE) doit être stocké en cookies par createBrowserClient côté client.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        return NextResponse.redirect(new URL(next, origin))
      }
      console.error("[auth/callback] exchangeCodeForSession error:", error.message)
    } catch (err) {
      console.error("[auth/callback] unexpected error:", err)
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin))
}
