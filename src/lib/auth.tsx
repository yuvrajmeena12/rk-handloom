import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type AuthStatus = 'loading' | 'signed_out' | 'not_admin' | 'admin'

interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  email: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Tracks the Supabase session and whether that user is the owner.
 *
 * "Owner" means the user has a row in public.admin_users, which can only be created
 * server-side. The row is read through Row Level Security (a user can read only their own),
 * so this check cannot be spoofed from the browser, and every admin write is independently
 * authorised by the database regardless of what this UI shows.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) {
      setSessionLoaded(true)
      return
    }
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionLoaded(true)
    })
    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setSessionLoaded(true)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null
  useEffect(() => {
    if (!supabase || !userId) {
      setIsAdmin(null)
      return
    }
    let active = true
    setIsAdmin(null)
    void supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) setIsAdmin(!error && Boolean(data))
      })
    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }, [])

  const status: AuthStatus = !sessionLoaded
    ? 'loading'
    : !session
      ? 'signed_out'
      : isAdmin === null
        ? 'loading'
        : isAdmin
          ? 'admin'
          : 'not_admin'

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      email: session?.user.email ?? null,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [status, session, signIn, signOut, sendPasswordReset, updatePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Maps Supabase auth errors to messages that do not reveal which half was wrong. */
export function friendlyAuthError(error: unknown): string {
  const message = (error as { message?: string } | null)?.message ?? ''
  if (/invalid login credentials/i.test(message)) return 'The email or password is not correct.'
  if (/email not confirmed/i.test(message)) return 'This email has not been confirmed yet. Check your inbox for the confirmation link.'
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a few minutes and try again.'
  if (/network|fetch/i.test(message)) return 'Could not reach the server. Check your connection and try again.'
  return message || 'Could not sign in. Please try again.'
}
