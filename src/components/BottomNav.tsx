import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Brain, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Home,     label: 'Home',          path: '/dashboard' },
  { icon: BookOpen, label: 'Prüfungen',     path: '/exams'     },
  { icon: Brain,    label: 'Lernen',        path: '/study'     },
  { icon: Settings, label: 'Einstellungen', path: '/settings'  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around"
      style={{
        height: '60px',
        backgroundColor: '#16161F',
        borderTop: '1px solid #2A2A3A',
        zIndex: 50,
      }}
    >
      {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
        const active = pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
          >
            <Icon size={22} style={{ color: active ? '#7C6FFF' : '#6060A0' }} />
            <span
              className="text-xs font-medium"
              style={{ color: active ? '#7C6FFF' : '#6060A0' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
