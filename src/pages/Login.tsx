import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { login, loading, error, clearError, user } = useAuthStore()
  const navigate = useNavigate()

  // Wenn bereits eingeloggt → direkt zum Dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  // Fehler zurücksetzen wenn der Nutzer tippt
  useEffect(() => {
    if (error) clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(email, password)
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
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#7C6FFF' }}
          >
            StudyFlow
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9090A8' }}>
            Willkommen zurück
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#E8E8F0' }}>
            Einloggen
          </h2>

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
            {/* E-Mail */}
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
                  style={{ color: '#6060A0' }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.de"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#0F0F14',
                    border: '1px solid #2A2A3A',
                    color: '#E8E8F0',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7C6FFF')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A3A')}
                />
              </div>
            </div>

            {/* Passwort */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: '#B0B0C8' }}
                >
                  Passwort
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: '#7C6FFF' }}
                >
                  Passwort vergessen?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#6060A0' }}
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#0F0F14',
                    border: '1px solid #2A2A3A',
                    color: '#E8E8F0',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7C6FFF')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A3A')}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity mt-2"
              style={{
                backgroundColor: '#7C6FFF',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Einloggen…
                </span>
              ) : (
                'Einloggen'
              )}
            </button>
          </form>
        </div>

        {/* Registrieren-Link */}
        <p className="text-center text-sm mt-6" style={{ color: '#9090A8' }}>
          Noch kein Konto?{' '}
          <Link
            to="/signup"
            className="font-medium transition-colors"
            style={{ color: '#7C6FFF' }}
          >
            Registrieren →
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
