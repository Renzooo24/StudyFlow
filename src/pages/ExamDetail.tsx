import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Brain, Plus, ChevronDown, ChevronUp, Trash2,
  Loader2, AlertCircle, BookOpen, BarChart2, Settings,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface Exam {
  id: string
  name: string
  exam_date: string
  color: string
  difficulty: number
}

interface Card {
  id: string
  front: string
  back: string
  next_review: string
}

type Tab = 'cards' | 'stats' | 'settings'

const COLORS = ['#7C6FFF', '#FF6F7C', '#6FFFAA', '#FFD06F', '#6FC8FF', '#FF9F6F']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl animate-pulse ${className ?? ''}`} style={{ backgroundColor: '#1A1A24' }} />
}

// ─── CardItem ─────────────────────────────────────────────────────────────────

function CardItem({ card, onDelete }: { card: Card; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('flashcards').delete().eq('id', card.id)
    onDelete(card.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
    >
      <div className="flex items-center gap-3 p-4">
        <p className="flex-1 text-sm font-medium" style={{ color: '#E8E8F0' }}>{card.front}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: '#6060A0' }}
            aria-label="Rückseite anzeigen"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: '#6060A0' }}
              aria-label="Karte löschen"
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#3D1A1A', color: '#F87171' }}
              >
                {deleting ? '…' : 'Ja'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ backgroundColor: '#1A1A24', color: '#9090A8' }}
              >
                Nein
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="h-px mb-3" style={{ backgroundColor: '#2A2A3A' }} />
              <p className="text-sm" style={{ color: '#9090A8' }}>{card.back}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── NewCardForm ──────────────────────────────────────────────────────────────

function NewCardForm({
  examId, userId, onCreated, onCancel,
}: {
  examId: string; userId: string; onCreated: (card: Card) => void; onCancel: () => void
}) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  const canSave = front.trim().length > 0 && back.trim().length > 0

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('flashcards')
        .insert({ exam_id: examId, user_id: userId, front: front.trim(), back: back.trim() })
        .select()
        .single()
      if (dbError) throw dbError
      onCreated(data as Card)
      setFront('')
      setBack('')
      setSaving(false)
    } catch {
      setError('Fehler beim Anlegen. Bitte versuche es erneut.')
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl p-5 mb-3"
      style={{ backgroundColor: '#16161F', border: '1px solid #7C6FFF' }}
    >
      <p className="text-sm font-semibold mb-4" style={{ color: '#E8E8F0' }}>Neue Karte</p>
      {error && <p className="text-xs mb-3" style={{ color: '#F87171' }}>{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#B0B0C8' }}>Vorderseite</label>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            onFocus={() => setFocused('front')}
            onBlur={() => setFocused(null)}
            placeholder="Begriff oder Frage…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{
              backgroundColor: '#0F0F14',
              border: `1px solid ${focused === 'front' ? '#7C6FFF' : '#2A2A3A'}`,
              color: '#E8E8F0',
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#B0B0C8' }}>Rückseite</label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            onFocus={() => setFocused('back')}
            onBlur={() => setFocused(null)}
            placeholder="Antwort oder Erklärung…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{
              backgroundColor: '#0F0F14',
              border: `1px solid ${focused === 'back' ? '#7C6FFF' : '#2A2A3A'}`,
              color: '#E8E8F0',
            }}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1A1A24', color: '#9090A8', border: '1px solid #2A2A3A' }}
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: '#7C6FFF', opacity: saving || !canSave ? 0.5 : 1, cursor: saving || !canSave ? 'not-allowed' : 'pointer' }}
        >
          {saving
            ? <span className="flex items-center justify-center gap-1.5"><Loader2 size={14} className="animate-spin" />…</span>
            : 'Anlegen'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Tab: Karteikarten ────────────────────────────────────────────────────────

function TabCards({
  cards, examId, userId, onCardsChange,
}: {
  cards: Card[]; examId: string; userId: string; onCardsChange: (cards: Card[]) => void
}) {
  const [showForm, setShowForm] = useState(false)

  const handleCreated = (card: Card) => {
    onCardsChange([...cards, card])
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    onCardsChange(cards.filter((c) => c.id !== id))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          <Plus size={15} />
          Neue Karte
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <NewCardForm
            examId={examId}
            userId={userId}
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <AnimatePresence>
          {cards.length === 0 && !showForm ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl py-14 px-8 text-center"
              style={{ backgroundColor: '#16161F', border: '1px dashed #2A2A3A' }}
            >
              <BookOpen size={28} className="mb-3" style={{ color: '#3A3A4A' }} />
              <p className="font-semibold mb-1" style={{ color: '#E8E8F0' }}>Noch keine Karten</p>
              <p className="text-sm" style={{ color: '#6060A0' }}>Erstelle deine erste Karteikarte!</p>
            </motion.div>
          ) : (
            cards.map((card) => (
              <CardItem key={card.id} card={card} onDelete={handleDelete} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Tab: Statistik ───────────────────────────────────────────────────────────

function TabStats() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl py-14 px-8 text-center"
      style={{ backgroundColor: '#16161F', border: '1px dashed #2A2A3A' }}
    >
      <BarChart2 size={28} className="mb-3" style={{ color: '#3A3A4A' }} />
      <p className="font-semibold mb-1" style={{ color: '#E8E8F0' }}>Statistik</p>
      <p className="text-sm" style={{ color: '#6060A0' }}>Kommt bald</p>
    </div>
  )
}

// ─── Tab: Einstellungen ───────────────────────────────────────────────────────

function TabSettings({
  exam, onUpdated, onDeleted,
}: {
  exam: Exam; onUpdated: (updated: Exam) => void; onDeleted: () => void
}) {
  const [name, setName] = useState(exam.name)
  const [date, setDate] = useState(exam.exam_date)
  const [color, setColor] = useState(exam.color)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !date) return
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await supabase
        .from('exams')
        .update({ name: name.trim(), exam_date: date, color })
        .eq('id', exam.id)
      if (error) throw error
      onUpdated({ ...exam, name: name.trim(), exam_date: date, color })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError('Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('exams').delete().eq('id', exam.id)
    onDeleted()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 space-y-5" style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>Fachname</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
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
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: '#0F0F14',
              border: `1px solid ${focused === 'date' ? '#7C6FFF' : '#2A2A3A'}`,
              color: '#E8E8F0',
              colorScheme: 'dark',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3" style={{ color: '#B0B0C8' }}>Farbe</label>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
              />
            ))}
          </div>
        </div>

        {saveError && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#F87171' }}>
            <AlertCircle size={13} />{saveError}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !date}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: saved ? '#1A5C35' : '#7C6FFF', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={15} className="animate-spin" />Speichern…</span>
            : saved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#16161F', border: '1px solid #3D1A1A' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#F87171' }}>Prüfung löschen</p>
        <p className="text-xs mb-4" style={{ color: '#6060A0' }}>
          Alle zugehörigen Karteikarten werden unwiderruflich gelöscht.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#2D1B1B', color: '#F87171', border: '1px solid #5C2D2D' }}
          >
            Prüfung löschen
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
              style={{ backgroundColor: '#5C2D2D', color: '#F87171' }}
            >
              {deleting ? <span className="flex items-center justify-center gap-1.5"><Loader2 size={14} className="animate-spin" />…</span> : 'Ja, löschen'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1A1A24', color: '#9090A8', border: '1px solid #2A2A3A' }}
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'cards',    label: 'Karteikarten', icon: BookOpen  },
  { id: 'stats',    label: 'Statistik',    icon: BarChart2 },
  { id: 'settings', label: 'Einstellungen', icon: Settings  },
]

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [exam, setExam] = useState<Exam | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('cards')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user || !id) return
    async function load() {
      const [examRes, cardsRes] = await Promise.all([
        supabase
          .from('exams')
          .select('id, name, exam_date, color, difficulty')
          .eq('id', id)
          .eq('user_id', user!.id)
          .single(),
        supabase
          .from('flashcards')
          .select('id, front, back, next_review')
          .eq('exam_id', id)
          .order('created_at', { ascending: true }),
      ])

      if (!examRes.data) {
        setNotFound(true)
      } else {
        setExam(examRes.data as Exam)
        setCards((cardsRes.data ?? []) as Card[])
      }
      setLoading(false)
    }
    load()
  }, [user, id])

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
        <Skeleton className="h-5 w-20 mb-6" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    )
  }

  if (notFound || !exam) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto text-center" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
        <p className="text-lg font-semibold mb-2" style={{ color: '#E8E8F0' }}>Prüfung nicht gefunden</p>
        <p className="text-sm mb-6" style={{ color: '#6060A0' }}>
          Diese Prüfung existiert nicht oder du hast keinen Zugriff.
        </p>
        <Link
          to="/exams"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          <ArrowLeft size={15} />
          Zurück zu Prüfungen
        </Link>
      </div>
    )
  }

  const days = daysUntil(exam.exam_date)
  const isUrgent = days <= 3
  const isWarning = days <= 7
  const countdownText = days < 0 ? 'Vorbei' : days === 0 ? 'Heute!' : `in ${days} Tag${days === 1 ? '' : 'en'}`
  const countdownColor = isWarning ? '#F87171' : '#9090A8'
  const dueCount = cards.filter((c) => c.next_review <= today).length

  return (
    <div className="max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ borderBottom: '1px solid #1A1A24' }}>
        <button
          onClick={() => navigate('/exams')}
          className="flex items-center gap-1.5 text-sm mb-5 transition-opacity hover:opacity-70"
          style={{ color: '#6060A0' }}
        >
          <ArrowLeft size={16} />
          Zurück
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-1 h-8 rounded-full mt-1 shrink-0" style={{ backgroundColor: exam.color }} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight" style={{ color: '#E8E8F0' }}>{exam.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm" style={{ color: '#6060A0' }}>
                {new Date(exam.exam_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              {isUrgent ? (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-xs font-semibold"
                  style={{ color: countdownColor }}
                >
                  {countdownText}
                </motion.span>
              ) : (
                <span className="text-xs font-medium" style={{ color: countdownColor }}>{countdownText}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5">
            <BookOpen size={14} style={{ color: '#6060A0' }} />
            <span className="text-sm" style={{ color: '#9090A8' }}>
              <span className="font-semibold" style={{ color: '#E8E8F0' }}>{cards.length}</span> Karten
            </span>
          </div>
          {dueCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Brain size={14} style={{ color: '#7C6FFF' }} />
              <span className="text-sm" style={{ color: '#9090A8' }}>
                <span className="font-semibold" style={{ color: '#7C6FFF' }}>{dueCount}</span> heute fällig
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate(`/study/${exam.id}`)}
          disabled={cards.length === 0}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#7C6FFF', opacity: cards.length === 0 ? 0.4 : 1, cursor: cards.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          <Brain size={16} />
          Lernen starten
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: '#1A1A24' }}>
        {TABS.map(({ id: tabId, label }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className="flex-1 py-3.5 text-sm font-medium transition-colors relative"
            style={{ color: activeTab === tabId ? '#7C6FFF' : '#6060A0' }}
          >
            {label}
            {activeTab === tabId && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: '#7C6FFF' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab-Inhalt */}
      <div className="px-4 py-5">
        {activeTab === 'cards' && (
          <TabCards
            cards={cards}
            examId={exam.id}
            userId={user!.id}
            onCardsChange={setCards}
          />
        )}
        {activeTab === 'stats' && <TabStats />}
        {activeTab === 'settings' && (
          <TabSettings
            exam={exam}
            onUpdated={setExam}
            onDeleted={() => navigate('/exams', { replace: true })}
          />
        )}
      </div>
    </div>
  )
}
