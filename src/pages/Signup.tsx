import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function Signup() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          <BookOpen size={28} color="#ffffff" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#E8E8F0' }}>
          Registrierung
        </h1>
        <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
          Kommt bald – wird im nächsten Schritt implementiert.
        </p>
        <Link
          to="/login"
          className="text-sm font-medium"
          style={{ color: '#7C6FFF' }}
        >
          ← Zurück zum Login
        </Link>
      </div>
    </div>
  )
}
