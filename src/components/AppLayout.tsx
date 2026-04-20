import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Brain, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import BottomNav from './BottomNav'

const NAV_ITEMS = [
  { icon: Home,     label: 'Home',          path: '/dashboard' },
  { icon: BookOpen, label: 'Prüfungen',     path: '/exams'     },
  { icon: Brain,    label: 'Lernen',        path: '/study'     },
  { icon: Settings, label: 'Einstellungen', path: '/settings'  },
]

function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout } = useAuthStore()

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56"
      style={{ backgroundColor: '#16161F', borderRight: '1px solid #2A2A3A', zIndex: 40 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          <BookOpen size={16} color="#fff" />
        </div>
        <span className="font-bold text-lg" style={{ color: '#7C6FFF' }}>StudyFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left"
              style={{
                backgroundColor: active ? 'rgba(124,111,255,0.12)' : 'transparent',
                color: active ? '#7C6FFF' : '#6060A0',
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#6060A0' }}
        >
          <LogOut size={18} />
          Ausloggen
        </button>
      </div>
    </aside>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      {/* Offset content: sidebar on desktop, bottom nav padding on mobile */}
      <main className="md:ml-56 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
