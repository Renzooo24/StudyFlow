import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, BookOpen, Loader2, Plus, X, AlertCircle, CalendarDays, Brain,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface Exam {
  id: string
  name: string
  exam_date: string
  color: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting(name: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Guten Morgen, ${name} 🌅`
  if (h < 18) return `Guten Tag, ${name} ☀️`
  return `Guten Abend, ${name} 🌙`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

const EXAM_COLORS = ['#7C6FFF', '#F87171', '#4ADE80', '#FBBF24', '#38BDF8', '#F472B6', '#A78BFA', '#FB923C']

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className ?? ''}`}
      style={{ backgroundColor: '#1A1A24' }}
    />
  )
}

// ─── Prüfungs-Card ────────────────────────────────────────────────────────────

function ExamCard({ exam, onDelete }: { exam: Exam; onDelete: (id: string) => void }) {
  const days = daysUntil(exam.exam_date)
  const isUrgent = days <= 3
  const isWarning = days <= 7

  const countdownColor = isWarning ? '#F87171' : '#9090A8'
  const countdownText =
    days < 0 ? 'Vorbei' : days === 0 ? 'Heute!' : `in ${days} Tag${days === 1 ? '' : 'en'}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative flex items-center gap-4 rounded-2xl p-5"
      style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
    >
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: exam.color }} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: '#E8E8F0' }}>{exam.name}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6060A0' }}>
          {new Date(exam.exam_date).toLocaleDateString('de-DE', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {isUrgent ? (
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: '#2D1B1B', color: countdownColor }}
        >
          {countdownText}
        </motion.span>
      ) : (
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: isWarning ? '#2D1B1B' : '#1A1A24', color: countdownColor }}
        >
          {countdownText}
        </span>
      )}

      <button
        onClick={() => onDelete(exam.id)}
        className="shrink-0 p-1 rounded-lg transition-opacity hover:opacity-60"
        style={{ color: '#6060A0' }}
        aria-label="Prüfung löschen"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

// ─── Neue Prüfung Modal ───────────────────────────────────────────────────────

function AddExamModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (exam: Exam) => void
}) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [color, setColor] = useState('#7C6FFF')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const { user } = useAuthStore()

  const canSave = name.trim().length > 0 && date.length > 0

  const handleSave = async () => {
    if (!canSave || !user) return
    setSaving(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('exams')
        .insert({ user_id: user.id, name: name.trim(), exam_date: date, color })
        .select()
        .single()
      if (dbError) throw dbError
      onSave(data as Exam)
      onClose()
    } catch {
      setError('Fehler beim Speichern. Bitte versuche es erneut.')
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl p-7"
        style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#E8E8F0' }}>Neue Prüfung</h2>
          <button onClick={onClose} style={{ color: '#6060A0' }}><X size={20} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl p-3 mb-4 text-sm"
            style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}>
            <AlertCircle size={15} className="shrink-0" />{error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>Fachname</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder="z.B. Mathematik II"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: '#0F0F14',
                border: `1px solid ${focused === 'name' ? '#7C6FFF' : '#2A2A3A'}`,
                color: '#E8E8F0',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>Prüfungsdatum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={() => setFocused('date')}
              onBlur={() => setFocused(null)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: '#0F0F14',
                border: `1px solid ${focused === 'date' ? '#7C6FFF' : '#2A2A3A'}`,
                color: '#E8E8F0',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#B0B0C8' }}>Farbe</label>
            <div className="flex gap-2 flex-wrap">
              {EXAM_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#1A1A24', color: '#9090A8', border: '1px solid #2A2A3A' }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{
              backgroundColor: '#7C6FFF',
              opacity: saving || !canSave ? 0.5 : 1,
              cursor: saving || !canSave ? 'not-allowed' : 'pointer',
            }}
          >
            {saving
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" />Speichern…</span>
              : 'Hinzufügen'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const [profileName, setProfileName] = useState('')
  const [exams, setExams] = useState<Exam[]>([])
  const [dueCards, setDueCards] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddExam, setShowAddExam] = useState(false)

  useEffect(() => {
    if (!user) return

    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0]

        const [profileRes, examsRes, cardsRes] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('name, university')
            .eq('id', user!.id)
            .single(),
          supabase
            .from('exams')
            .select('id, name, exam_date, color')
            .eq('user_id', user!.id)
            .gte('exam_date', today)
            .order('exam_date', { ascending: true }),
          supabase
            .from('flashcards')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id)
            .lte('next_review', today),
        ])

        if (!profileRes.data?.university) {
          navigate('/onboarding', { replace: true })
          return
        }

        setProfileName(profileRes.data.name ?? user!.user_metadata?.full_name ?? '')
        setExams((examsRes.data ?? []) as Exam[])
        setDueCards(cardsRes.count ?? 0)
      } catch {
        setError('Daten konnten nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, navigate])

  const handleDeleteExam = async (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id))
    await supabase.from('exams').delete().eq('id', id)
  }

  const handleExamAdded = (exam: Exam) => {
    setExams((prev) =>
      [...prev, exam].sort(
        (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime(),
      ),
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-7 w-52 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <Skeleton className="h-28 w-full mb-6" />
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen px-4 py-8 max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#E8E8F0' }}>
              {greeting(profileName)}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6060A0' }}>
              {formatDate(new Date())}
            </p>
          </div>
          <button
            onClick={logout}
            className="md:hidden p-2 rounded-xl transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A', color: '#6060A0' }}
            aria-label="Ausloggen"
          >
            <LogOut size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl p-4 mb-6 text-sm"
            style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}>
            <AlertCircle size={16} className="shrink-0" />{error}
          </div>
        )}

        {/* Heute lernen */}
        <motion.div
          className="rounded-2xl p-6 mb-8"
          style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#7C6FFF' }}>
              <Brain size={20} color="#fff" />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#9090A8' }}>Wiederholung</p>
              <p className="font-semibold" style={{ color: '#E8E8F0' }}>Heute lernen</p>
            </div>
          </div>

          {dueCards > 0 ? (
            <div className="flex items-center justify-between">
              <p style={{ color: '#9090A8' }}>
                <span className="text-2xl font-bold" style={{ color: '#7C6FFF' }}>{dueCards}</span>
                <span className="text-sm ml-2">Karte{dueCards !== 1 ? 'n' : ''} fällig</span>
              </p>
              <button
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#7C6FFF' }}
              >
                Jetzt lernen →
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: '#9090A8' }}>
              Heute alles erledigt! 🎉
            </p>
          )}
        </motion.div>

        {/* Prüfungen */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} style={{ color: '#7C6FFF' }} />
            <h2 className="font-semibold" style={{ color: '#E8E8F0' }}>Deine Prüfungen</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#1A1A24', color: '#6060A0' }}>
            {exams.length}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <AnimatePresence>
            {exams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl p-8 text-center"
                style={{ backgroundColor: '#16161F', border: '1px dashed #2A2A3A' }}
              >
                <BookOpen size={28} className="mx-auto mb-3" style={{ color: '#3A3A4A' }} />
                <p className="text-sm" style={{ color: '#6060A0' }}>Noch keine Prüfungen eingetragen.</p>
              </motion.div>
            ) : (
              exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} onDelete={handleDeleteExam} />
              ))
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setShowAddExam(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#16161F', border: '1px dashed #3A3A5A', color: '#7C6FFF' }}
        >
          <Plus size={17} />
          Neue Prüfung
        </button>
      </div>

      <AnimatePresence>
        {showAddExam && (
          <AddExamModal
            onClose={() => setShowAddExam(false)}
            onSave={handleExamAdded}
          />
        )}
      </AnimatePresence>
    </>
  )
}
