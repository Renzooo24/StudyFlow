import { motion } from 'framer-motion'
import { LogOut, BookOpen } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'Lernender'

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
