import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ArrowLeft, Brain, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { calculateNextReview, Rating } from '../lib/sm2'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface SessionCard {
  id: string
  front: string
  back: string
  next_review: string
  interval: number | null
  easiness_factor: number | null
  repetitions: number | null
}

const RATING_CONFIG: { rating: Rating; label: string; color: string; bg: string }[] = [
  { rating: 0, label: 'Nochmal', color: '#F87171', bg: '#2D1B1B' },
  { rating: 1, label: 'Schwer',  color: '#FB923C', bg: '#2D1E14' },
  { rating: 2, label: 'Gut',     color: '#4ADE80', bg: '#14291E' },
  { rating: 3, label: 'Perfekt', color: '#A78BFA', bg: '#1E1B2E' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Fortschrittsbalken ───────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100)
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: '#6060A0' }}>
          Karte <span style={{ color: '#E8E8F0', fontWeight: 600 }}>{Math.min(current + 1, total)}</span> / {total}
        </span>
        <span className="text-xs font-medium" style={{ color: '#6060A0' }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1A1A24' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: '#7C6FFF' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// ─── Karteikarte ──────────────────────────────────────────────────────────────

function FlipCard({
  card, flipped, onFlip, onRate, saving, dragX,
}: {
  card: SessionCard
  flipped: boolean
  onFlip: () => void
  onRate: (r: Rating) => void
  saving: boolean
  dragX: number
}) {
  const showLeft  = flipped && dragX < -24
  const showRight = flipped && dragX >  24

  return (
    <div className="relative w-full">
      {/* Karten-Flip */}
      <div style={{ perspective: '1200px' }} onClick={!flipped ? onFlip : undefined}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: '260px' }}
        >
          {/* Vorderseite */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8 cursor-pointer select-none"
            style={{
              backgroundColor: '#16161F',
              border: '1px solid #2A2A3A',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <p className="text-2xl font-bold text-center leading-snug" style={{ color: '#E8E8F0' }}>
              {card.front}
            </p>
            <p className="mt-6 text-xs" style={{ color: '#3A3A4A' }}>Tippen zum Aufdecken</p>
          </div>

          {/* Rückseite */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8 cursor-default select-none"
            style={{
              backgroundColor: '#2A2440',
              border: '1px solid #3A3060',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-sm font-semibold mb-3 uppercase tracking-widest" style={{ color: '#6060A0' }}>
              Antwort
            </p>
            <p className="text-xl font-semibold text-center leading-relaxed" style={{ color: '#E8E8F0' }}>
              {card.back}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Wisch-Hinweis links (Nochmal) */}
      <AnimatePresence>
        {showLeft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-4 px-3 py-1.5 rounded-xl text-xs font-bold pointer-events-none"
            style={{ backgroundColor: '#2D1B1B', color: '#F87171', border: '1px solid #5C2D2D' }}
          >
            Nochmal ←
          </motion.div>
        )}
        {showRight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-xl text-xs font-bold pointer-events-none"
            style={{ backgroundColor: '#14291E', color: '#4ADE80', border: '1px solid #1A5C35' }}
          >
            → Gut
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bewertungs-Buttons (nur nach Flip) */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-2 mt-4"
          >
            {RATING_CONFIG.map(({ rating, label, color, bg }) => (
              <button
                key={rating}
                onClick={() => !saving && onRate(rating)}
                disabled={saving}
                className="py-4 rounded-2xl text-sm font-bold transition-opacity active:scale-95"
                style={{
                  backgroundColor: bg,
                  color,
                  border: `1px solid ${color}33`,
                  opacity: saving ? 0.5 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flip-Hinweis vor dem Umdrehen */}
      {!flipped && (
        <p className="text-center text-xs mt-3" style={{ color: '#3A3A4A' }}>
          oder wische nach links / rechts
        </p>
      )}
    </div>
  )
}

// ─── Session-Ende ─────────────────────────────────────────────────────────────

function SessionEnd({
  results, onRetry, onBack,
}: {
  results: Rating[]
  onRetry: () => void
  onBack: () => void
}) {
  const counts = RATING_CONFIG.map(({ rating, label, color }) => ({
    label,
    color,
    count: results.filter((r) => r === rating).length,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(124,111,255,0.15)' }}
      >
        <CheckCircle2 size={40} style={{ color: '#7C6FFF' }} />
      </div>

      <h2 className="text-2xl font-bold mb-2" style={{ color: '#E8E8F0' }}>
        Session abgeschlossen!
      </h2>
      <p className="text-sm mb-8" style={{ color: '#6060A0' }}>
        Du hast <span style={{ color: '#E8E8F0', fontWeight: 600 }}>{results.length}</span> {results.length === 1 ? 'Karte' : 'Karten'} gelernt
      </p>

      {/* Bewertungs-Aufschlüsselung */}
      <div className="w-full rounded-2xl p-5 mb-8 space-y-3" style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}>
        {counts.map(({ label, color, count }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="text-sm w-20 text-left" style={{ color: '#9090A8' }}>{label}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1A1A24' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: results.length > 0 ? `${(count / results.length) * 100}%` : '0%' }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
            </div>
            <span className="text-sm font-semibold w-6 text-right" style={{ color }}>
              {count}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1A1A24', color: '#9090A8', border: '1px solid #2A2A3A' }}
        >
          <RotateCcw size={15} />
          Neue Session
        </button>
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          <Brain size={15} />
          Zur Übersicht
        </button>
      </div>
    </motion.div>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function StudySession() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [cards, setCards]               = useState<SessionCard[]>([])
  const [loading, setLoading]           = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped]           = useState(false)
  const [results, setResults]           = useState<Rating[]>([])
  const [saving, setSaving]             = useState(false)
  const [dragX, setDragX]              = useState(0)

  const loadCards = async () => {
    if (!user || !examId) return
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('flashcards')
      .select('id, front, back, next_review, interval, easiness_factor, repetitions')
      .eq('exam_id', examId)
      .eq('user_id', user.id)
      .lte('next_review', today)
    setCards(shuffle((data ?? []) as SessionCard[]))
    setCurrentIndex(0)
    setFlipped(false)
    setResults([])
    setLoading(false)
  }

  useEffect(() => { loadCards() }, [user, examId])

  const handleRate = async (rating: Rating) => {
    if (saving) return
    setSaving(true)
    const card = cards[currentIndex]
    const { newInterval, newEasinessFactor, newRepetitions, nextReviewDate } =
      calculateNextReview(
        {
          interval: card.interval ?? 1,
          easiness_factor: card.easiness_factor ?? 2.5,
          repetitions: card.repetitions ?? 0,
        },
        rating,
      )
    await supabase.from('flashcards').update({
      interval: newInterval,
      easiness_factor: newEasinessFactor,
      repetitions: newRepetitions,
      next_review: nextReviewDate.toISOString().split('T')[0],
      last_review: new Date().toISOString().split('T')[0],
    }).eq('id', card.id)
    setResults((prev) => [...prev, rating])
    setCurrentIndex((prev) => prev + 1)
    setFlipped(false)
    setDragX(0)
    setSaving(false)
  }

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (!flipped) return
    const { offset, velocity } = info
    if (offset.x < -80 || velocity.x < -300) { handleRate(0); return }
    if (offset.x >  80 || velocity.x >  300) { handleRate(2); return }
    setDragX(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0F0F14' }}>
        <Brain size={32} className="animate-pulse" style={{ color: '#7C6FFF' }} />
      </div>
    )
  }

  // Keine fälligen Karten
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center" style={{ backgroundColor: '#0F0F14' }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ backgroundColor: '#1A1A24' }}>
          <CheckCircle2 size={36} style={{ color: '#7C6FFF' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#E8E8F0' }}>Heute keine Karten fällig</h2>
        <p className="text-sm mb-8" style={{ color: '#6060A0' }}>
          Du bist auf dem neuesten Stand. Schau morgen wieder vorbei!
        </p>
        <button
          onClick={() => navigate(`/exams/${examId}`)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          <ArrowLeft size={15} />
          Zurück zur Prüfung
        </button>
      </div>
    )
  }

  const isFinished = currentIndex >= cards.length

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0F0F14' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3">
        <button
          onClick={() => navigate(`/exams/${examId}`)}
          className="p-2 rounded-xl transition-opacity hover:opacity-70"
          style={{ color: '#6060A0' }}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-semibold flex-1 text-center" style={{ color: '#9090A8' }}>
          Lernen
        </span>
        <div className="w-9" />
      </div>

      {/* Fortschrittsbalken */}
      {!isFinished && (
        <ProgressBar current={currentIndex} total={cards.length} />
      )}

      {/* Haupt-Inhalt */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-8">
        {isFinished ? (
          <SessionEnd
            results={results}
            onRetry={loadCards}
            onBack={() => navigate(`/exams/${examId}`)}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
            >
              <motion.div
                drag={flipped ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDrag={(_, info) => setDragX(info.offset.x)}
                onDragEnd={handleDragEnd}
              >
                <FlipCard
                  card={cards[currentIndex]}
                  flipped={flipped}
                  onFlip={() => setFlipped(true)}
                  onRate={handleRate}
                  saving={saving}
                  dragX={dragX}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
