import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(translateError(resetError.message))
      return
    }

    setSuccess(true)
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
            Passwort zurücksetzen
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#E8E8F0' }}>
            Passwort vergessen?
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
            Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.
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
                Wir haben dir einen Reset-Link geschickt. Prüfe dein Postfach – und auch den Spam-Ordner.
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
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#B0B0C8' }}
                  >
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: focused ? '#7C6FFF' : '#6060A0' }}
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null) }}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="deine@email.de"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: '#0F0F14',
                        border: `1px solid ${focused ? '#7C6FFF' : '#2A2A3A'}`,
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
                      Wird gesendet…
                    </span>
                  ) : (
                    'Reset-Link senden'
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
  if (message.includes('Email rate limit exceeded'))
    return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'
  if (message.includes('Unable to validate email address') || message.includes('invalid email'))
    return 'Bitte gib eine gültige E-Mail-Adresse ein.'
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
}
