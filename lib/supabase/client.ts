import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://xvtszchjaezonzemjfjl.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dHN6Y2hqYWV6b256ZW1qZmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTg2NzQsImV4cCI6MjA4MzU3NDY3NH0.TQqt5aDe3tSObTQHK871ODH0Kb-ozkebrRA0UfW7o7k'

/**
 * Client Supabase pour le navigateur.
 * Utilise createBrowserClient (@supabase/ssr) pour stocker le PKCE en cookies,
 * ce qui permet à exchangeCodeForSession de fonctionner correctement dans le callback OAuth.
 */
function makeSupabaseClient() {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = makeSupabaseClient()
