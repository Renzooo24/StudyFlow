import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, User, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Validierung ─────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string
  email?: string
  password?: string
  passwordConfirm?: string
}

function validate(name: string, email: string, password: string, passwordConfirm: string): FormErrors {
  const errors: FormErrors = {}

  if (name.trim().length < 2)
    errors.name = 'Vorname muss mindestens 2 Zeichen lang sein.'

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'

  if (password.length < 8)
    errors.password = 'Passwort muss mindestens 8 Zeichen lang sein.'

  if (password !== passwordConfirm)
    errors.passwordConfirm = 'Die Passwörter stimmen nicht überein.'

  return errors
}

// ─── Eingabefeld-Komponente ───────────────────────────────────────────────────

interface FieldProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: React.ReactNode
  error?: string
  autoComplete?: string
}

function Field({ id, label, type, value, onChange, placeholder, icon, error, autoComplete }: FieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: focused ? '#7C6FFF' : '#6060A0' }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            backgroundColor: '#0F0F14',
            border: `1px solid ${error ? '#5C2D2D' : focused ? '#7C6FFF' : '#2A2A3A'}`,
            color: '#E8E8F0',
          }}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: '#F87171' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}

// ─── Seite ────────────────────────────────────────────────────────────────────

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/onboarding', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    // Clientseitige Validierung
    const errors = validate(name, email, password, passwordConfirm)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setSubmitting(true)

    // 1. Supabase Registrierung
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    })

    if (signUpError) {
      setSubmitting(false)
      setServerError(translateServerError(signUpError.message))
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setSubmitting(false)
      setServerError('Registrierung fehlgeschlagen. Bitte versuche es erneut.')
      return
    }

    // 2. user_profiles-Eintrag erstellen
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: userId, name: name.trim() })

    if (profileError) {
      // Kein harter Fehler – Profil kann später noch angelegt werden
      console.error('Profil-Eintrag fehlgeschlagen:', profileError.message)
    }

    setSubmitting(false)
    navigate('/onboarding', { replace: true })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#7C6FFF' }}
          >
            <BookOpen size={28} color="#ffffff" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#7C6FFF' }}>
            StudyFlow
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9090A8' }}>
            Konto erstellen – kostenlos
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#E8E8F0' }}>
            Registrieren
          </h2>

          {/* Server-Fehler */}
          {serverError && (
            <motion.div
              className="flex items-start gap-3 rounded-xl p-4 mb-5"
              style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D' }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={18} color="#F87171" className="mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: '#F87171' }}>{serverError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              id="name"
              label="Vorname"
              type="text"
              autoComplete="given-name"
              value={name}
              onChange={(v) => { setName(v); setFieldErrors((p) => ({ ...p, name: undefined })) }}
              placeholder="Max"
              icon={<User size={16} />}
              error={fieldErrors.name}
            />
            <Field
              id="email"
              label="E-Mail-Adresse"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(v) => { setEmail(v); setFieldErrors((p) => ({ ...p, email: undefined })) }}
              placeholder="max@beispiel.de"
              icon={<Mail size={16} />}
              error={fieldErrors.email}
            />
            <Field
              id="password"
              label="Passwort"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(v) => { setPassword(v); setFieldErrors((p) => ({ ...p, password: undefined })) }}
              placeholder="Mindestens 8 Zeichen"
              icon={<Lock size={16} />}
              error={fieldErrors.password}
            />
            <Field
              id="passwordConfirm"
              label="Passwort wiederholen"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(v) => { setPasswordConfirm(v); setFieldErrors((p) => ({ ...p, passwordConfirm: undefined })) }}
              placeholder="••••••••"
              icon={<Lock size={16} />}
              error={fieldErrors.passwordConfirm}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity mt-2"
              style={{
                backgroundColor: '#7C6FFF',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Konto wird erstellt…
                </span>
              ) : (
                'Konto erstellen'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#9090A8' }}>
          Bereits ein Konto?{' '}
          <Link to="/login" className="font-medium" style={{ color: '#7C6FFF' }}>
            ← Einloggen
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

// ─── Hilfsfunktion ────────────────────────────────────────────────────────────

function translateServerError(message: string): string {
  if (message.includes('User already registered') || message.includes('already been registered'))
    return 'Diese E-Mail-Adresse ist bereits registriert.'
  if (message.includes('Password should be at least'))
    return 'Das Passwort muss mindestens 8 Zeichen lang sein.'
  if (message.includes('Unable to validate email address') || message.includes('invalid email'))
    return 'Bitte gib eine gültige E-Mail-Adresse ein.'
  if (message.includes('Email rate limit exceeded'))
    return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'
  return 'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
}
