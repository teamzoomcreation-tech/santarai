/**
 * Récupération des sessions Supabase corrompues.
 * L'erreur "Cannot create property 'user' on string" survient lorsque la session
 * stockée (cookies) est parsée comme une string au lieu d'un objet JSON.
 * Cette utilitaire nettoie les cookies Supabase auth pour forcer une ré-authentification propre.
 */

const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-'

/**
 * Supprime tous les cookies Supabase Auth (session corrompue).
 * Les cookies suivent le pattern: sb-{host}-auth-token, sb-{host}-auth-token.0, etc.
 */
export function clearSupabaseAuthCookies(): void {
  if (typeof document === 'undefined') return

  const cookies = document.cookie.split(';')
  const toRemove: string[] = []

  for (const cookie of cookies) {
    const [name] = cookie.trim().split('=')
    if (name && name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX)) {
      toRemove.push(name.trim())
    }
  }

  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'
  const path = 'path=/'

  for (const name of toRemove) {
    document.cookie = `${name}=;${expires};${path}`
  }

  if (toRemove.length > 0) {
    console.warn('[Supabase Auth] Session corrompue détectée. Cookies auth supprimés.')
  }
}

/**
 * Vérifie si une erreur correspond à la session string corrompue.
 * L'erreur survient quand auth-js reçoit une string au lieu d'un objet depuis le storage.
 */
export function isSessionStringError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error)
  return (
    msg.includes("Cannot create property 'user' on string") ||
    msg.includes("create property 'user' on string")
  )
}
