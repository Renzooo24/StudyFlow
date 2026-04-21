import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full py-5 px-4 flex items-center justify-center gap-4 flex-wrap">
      <Link
        to="/impressum"
        className="text-xs transition-opacity hover:opacity-80"
        style={{ color: '#4A4A6A' }}
      >
        Impressum
      </Link>
      <span className="text-xs" style={{ color: '#2A2A3A' }}>|</span>
      <Link
        to="/datenschutz"
        className="text-xs transition-opacity hover:opacity-80"
        style={{ color: '#4A4A6A' }}
      >
        Datenschutz
      </Link>
      <span className="text-xs" style={{ color: '#2A2A3A' }}>|</span>
      <span className="text-xs" style={{ color: '#3A3A5A' }}>© 2026 StudyFlow</span>
    </footer>
  )
}
