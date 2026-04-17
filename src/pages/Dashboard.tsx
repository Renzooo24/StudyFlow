import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, BookOpen, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  const name = user?.user_metadata?.full_name ?? user?.email ?? 'Lernender'

  // Onboarding-Check: falls Profil noch nicht vollständig → /onboarding
  useEffect(() => {
    if (!user) return

    async function checkOnboarding() {
      const { data } = await supabase
        .from('user_profiles')
        .select('university')
        .eq('id', user!.id)
        .single()

      if (!data?.university) {
        navigate('/onboarding', { replace: true })
        return
      }

      setChecking(false)
    }

    checkOnboarding()
  }, [user, navigate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0F14' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#7C6FFF' }} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          <BookOpen size={32} color="#ffffff" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#E8E8F0' }}>
          Willkommen, {name}!
        </h1>
        <p className="text-sm mb-8" style={{ color: '#9090A8' }}>
          Du bist eingeloggt. Das Dashboard wird bald ausgebaut.
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1A1A24', color: '#E8E8F0', border: '1px solid #2A2A3A' }}
        >
          <LogOut size={16} />
          Ausloggen
        </button>
      </motion.div>
    </div>
  )
}
