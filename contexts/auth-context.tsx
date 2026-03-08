"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { clearSupabaseAuthCookies, isSessionStringError } from "@/lib/supabase/auth-recovery"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const applySession = (s: Session | null) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    }

    const handleSessionError = (err: unknown) => {
      if (isSessionStringError(err)) {
        clearSupabaseAuthCookies()
        applySession(null)
      } else {
        setLoading(false)
      }
    }

    // Get initial session (protège contre "Cannot create property 'user' on string")
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(handleSessionError)

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        applySession(session)
      } catch (err) {
        handleSessionError(err)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
