import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validSession, setValidSession] = useState<boolean | null>(null)

  const navigate = useNavigate()

  // Supabase schreibt die Session aus dem Reset-Link automatisch –
  // wir prüfen, ob eine aktive Session vorhanden ist.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(!!session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(translateError(updateError.message))
      return
    }

    setSuccess(true)
    // Nach 2 Sekunden zum Login weiterleiten
    setTimeout(() => navigate('/login', { replace: true }), 2000)
  }

  // Noch am Laden der Session
  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0F14' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#7C6FFF' }} />
      </div>
    )
  }

  // Ungültiger oder abgelaufener Link
  if (validSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0F0F14' }}>
        <div className="text-center max-w-sm">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#7C6FFF' }}
          >
            <BookOpen size={28} color="#ffffff" />
          </div>
          <h2 className="text-xl font-semibold mb-3" style={{ color: '#E8E8F0' }}>
            Link ungültig oder abgelaufen
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
            Dieser Reset-Link ist nicht mehr gültig. Bitte fordere einen neuen an.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#7C6FFF' }}
          >
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
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
            Neues Passwort vergeben
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#E8E8F0' }}>
            Passwort zurücksetzen
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
            Wähle ein neues Passwort für deinen Account.
          </p>

          {/* Erfolgsmeldung */}
          {success ? (
            <motion.div
              className="flex items-start gap-3 rounded-xl p-4"
              style={{ backgroundColor: '#0F2D1B', border: '1px solid #1A5C35' }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 size={18} color="#4ADE80" className="mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: '#4ADE80' }}>
                Passwort erfolgreich geändert. Du wirst zum Login weitergeleitet…
              </p>
            </motion.div>
          ) : (
            <>
              {/* Fehlermeldung */}
              {error && (
                <motion.div
                  className="flex items-start gap-3 rounded-xl p-4 mb-5"
                  style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={18} color="#F87171" className="mt-0.5 shrink-0" />
                  <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Neues Passwort */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
                    Neues Passwort
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: focusedField === 'password' ? '#7C6FFF' : '#6060A0' }}
                    />
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null) }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Mindestens 8 Zeichen"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#0F0F14',
                        border: `1px solid ${focusedField === 'password' ? '#7C6FFF' : '#2A2A3A'}`,
                        color: '#E8E8F0',
                      }}
                    />
                  </div>
                </div>

                {/* Passwort wiederholen */}
                <div>
                  <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
                    Passwort wiederholen
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: focusedField === 'confirm' ? '#7C6FFF' : '#6060A0' }}
                    />
                    <input
                      id="passwordConfirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => { setPasswordConfirm(e.target.value); setError(null) }}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#0F0F14',
                        border: `1px solid ${focusedField === 'confirm' ? '#7C6FFF' : '#2A2A3A'}`,
                        color: '#E8E8F0',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
                  style={{
                    backgroundColor: '#7C6FFF',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Wird gespeichert…
                    </span>
                  ) : (
                    'Passwort speichern'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#9090A8' }}>
          <Link to="/login" className="font-medium" style={{ color: '#7C6FFF' }}>
            ← Zurück zum Login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

function translateError(message: string): string {
  if (message.includes('Password should be at least'))
    return 'Das Passwort muss mindestens 8 Zeichen lang sein.'
  if (message.includes('Auth session missing') || message.includes('session_not_found'))
    return 'Deine Sitzung ist abgelaufen. Bitte fordere einen neuen Reset-Link an.'
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
}
