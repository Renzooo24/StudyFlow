import { Clock } from 'lucide-react'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: '#1A1A24' }}
      >
        <Clock size={26} style={{ color: '#7C6FFF' }} />
      </div>
      <h1 className="text-xl font-bold mb-2" style={{ color: '#E8E8F0' }}>{title}</h1>
      <p className="text-sm" style={{ color: '#6060A0' }}>Kommt bald</p>
    </div>
  )
}
