import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

function HomePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <motion.div
        className="text-center px-6"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#7C6FFF' }}
          >
            <BookOpen size={40} color="#ffffff" />
          </div>
        </motion.div>

        {/* Überschrift */}
        <motion.h1
          className="text-4xl sm:text-5xl font-bold mb-4"
          style={{ color: '#E8E8F0' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          StudyFlow läuft! 🎓
        </motion.h1>

        {/* Untertitel */}
        <motion.p
          className="text-lg mb-10"
          style={{ color: '#9090A8' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Smarter lernen, besser organisieren.
        </motion.p>

        {/* Status-Badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          {[
            'React 18',
            'TypeScript',
            'Vite',
            'Tailwind CSS v4',
            'React Router v6',
            'Zustand',
            'Supabase',
            'Framer Motion',
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: '#1A1A24', color: '#7C6FFF', border: '1px solid #7C6FFF33' }}
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
