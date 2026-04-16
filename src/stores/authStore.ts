import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
}

function translateError(message: string): string {
  if (message.includes('Invalid login credentials'))
    return 'Falsche E-Mail-Adresse oder falsches Passwort.'
  if (message.includes('Email not confirmed'))
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.'
  if (message.includes('User already registered'))
    return 'Diese E-Mail-Adresse ist bereits registriert.'
  if (message.includes('Password should be at least'))
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
  if (message.includes('Unable to validate email address') || message.includes('invalid email'))
    return 'Bitte gib eine gültige E-Mail-Adresse ein.'
  if (message.includes('User not found'))
    return 'Kein Konto mit dieser E-Mail-Adresse gefunden.'
  if (message.includes('Email rate limit exceeded'))
    return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ loading: false, error: translateError(error.message) })
      return
    }
    set({ loading: false, user: data.user, session: data.session, error: null })
  },

  signup: async (email, password, name) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      set({ loading: false, error: translateError(error.message) })
      return
    }
    set({ loading: false, user: data.user, session: data.session, error: null })
  },

  logout: async () => {
    set({ loading: true, error: null })
    await supabase.auth.signOut()
    set({ loading: false, user: null, session: null, error: null })
  },

  checkSession: async () => {
    set({ loading: true })
    const { data } = await supabase.auth.getSession()
    set({
      loading: false,
      user: data.session?.user ?? null,
      session: data.session ?? null,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session: session ?? null })
    })
  },
}))
