import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Loader2, ChevronDown, Check } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

interface Card {
  id: string
  front: string
  back: string
  next_review: string
}

interface ExamOption {
  id: string
  name: string
  color: string
}

interface SourceCard {
  id: string
  front: string
  back: string
}

interface Props {
  examId: string
  onClose: () => void
  onImported: (cards: Card[]) => void
}

interface ParsedRow {
  front: string
  back: string
}

type Mode = 'text' | 'exam'

function parseLines(raw: string): ParsedRow[] {
  return raw
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('|')
      if (idx === -1) return null
      const front = line.slice(0, idx).trim()
      const back = line.slice(idx + 1).trim()
      if (!front || !back) return null
      return { front, back }
    })
    .filter((r): r is ParsedRow => r !== null)
}

// ─── Tab: Text ────────────────────────────────────────────────────────────────

function TextTab({
  examId, onImported, onClose,
}: {
  examId: string; onImported: (cards: Card[]) => void; onClose: () => void
}) {
  const { user } = useAuthStore()
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => parseLines(raw), [raw])

  const handleImport = async () => {
    if (!user || parsed.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const rows = parsed.map((r) => ({
        exam_id: examId,
        user_id: user.id,
        front: r.front,
        back: r.back,
        next_review: today,
      }))
      const { data, error: dbError } = await supabase
        .from('flashcards')
        .insert(rows)
        .select('id, front, back, next_review')
      if (dbError) throw dbError
      onImported(data as Card[])
      onClose()
    } catch {
      setError('Fehler beim Importieren. Bitte versuche es erneut.')
      setSaving(false)
    }
  }

  return (
    <>
      <p className="text-xs mb-4" style={{ color: '#6060A0' }}>
        Pro Zeile eine Karte im Format: <span style={{ color: '#9090A8' }}>Frage | Antwort</span>
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-xl p-3 mb-4 text-sm"
          style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}>
          <AlertCircle size={15} className="shrink-0" />{error}
        </div>
      )}

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={'Photosynthese | Prozess, bei dem Pflanzen Licht in Energie umwandeln\nMitose | Zellteilung zur Verdopplung der Zellen\nOhmsches Gesetz | U = R × I'}
        rows={7}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
        style={{ backgroundColor: '#0F0F14', border: '1px solid #2A2A3A', color: '#E8E8F0' }}
      />

      <AnimatePresence>
        {parsed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <p className="text-xs font-medium mb-2" style={{ color: '#B0B0C8' }}>
              Vorschau — {parsed.length} {parsed.length === 1 ? 'Karte' : 'Karten'} erkannt
            </p>
            <div className="rounded-xl overflow-hidden max-h-36 overflow-y-auto" style={{ border: '1px solid #2A2A3A' }}>
              {parsed.map((row, i) => (
                <div
                  key={i}
                  className="flex gap-3 px-4 py-2.5 text-xs"
                  style={{
                    backgroundColor: i % 2 === 0 ? '#0F0F14' : '#12121A',
                    borderBottom: i < parsed.length - 1 ? '1px solid #1A1A24' : 'none',
                  }}
                >
                  <span className="flex-1 truncate" style={{ color: '#E8E8F0' }}>{row.front}</span>
                  <span className="shrink-0" style={{ color: '#3A3A4A' }}>→</span>
                  <span className="flex-1 truncate text-right" style={{ color: '#9090A8' }}>{row.back}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1A1A24', color: '#9090A8', border: '1px solid #2A2A3A' }}
        >
          Abbrechen
        </button>
        <button
          onClick={handleImport}
          disabled={saving || parsed.length === 0}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{
            backgroundColor: '#7C6FFF',
            opacity: saving || parsed.length === 0 ? 0.5 : 1,
            cursor: saving || parsed.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {saving
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Importieren…</span>
            : `Alle importieren${parsed.length > 0 ? ` (${parsed.length})` : ''}`}
        </button>
      </div>
    </>
  )
}

// ─── Tab: Aus Prüfung ─────────────────────────────────────────────────────────

function ExamTab({
  currentExamId, onImported, onClose,
}: {
  currentExamId: string; onImported: (cards: Card[]) => void; onClose: () => void
}) {
  const { user } = useAuthStore()

  const [exams, setExams] = useState<ExamOption[]>([])
  const [examsLoading, setExamsLoading] = useState(true)

  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [sourceCards, setSourceCards] = useState<SourceCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load other exams once
  useEffect(() => {
    if (!user) return
    supabase
      .from('exams')
      .select('id, name, color')
      .eq('user_id', user.id)
      .neq('id', currentExamId)
      .order('exam_date', { ascending: true })
      .then(({ data }) => {
        setExams((data ?? []) as ExamOption[])
        setExamsLoading(false)
      })
  }, [user, currentExamId])

  // Load cards when exam changes
  useEffect(() => {
    if (!selectedExamId) return
    setCardsLoading(true)
    setSourceCards([])
    setChecked(new Set())
    supabase
      .from('flashcards')
      .select('id, front, back')
      .eq('exam_id', selectedExamId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setSourceCards((data ?? []) as SourceCard[])
        setCardsLoading(false)
      })
  }, [selectedExamId])

  const toggleCard = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (checked.size === sourceCards.length) {
      setChecked(new Set())
    } else {
      setChecked(new Set(sourceCards.map((c) => c.id)))
    }
  }

  const handleImport = async () => {
    if (!user || checked.size === 0) return
    setSaving(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const rows = sourceCards
        .filter((c) => checked.has(c.id))
        .map((c) => ({
          exam_id: currentExamId,
          user_id: user.id,
          front: c.front,
          back: c.back,
          next_review: today,
        }))
      const { data, error: dbError } = await supabase
        .from('flashcards')
        .insert(rows)
        .select('id, front, back, next_review')
      if (dbError) throw dbError
      onImported(data as Card[])
      onClose()
    } catch {
      setError('Fehler beim Importieren. Bitte versuche es erneut.')
      setSaving(false)
    }
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId)

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 rounded-xl p-3 mb-4 text-sm"
          style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}>
          <AlertCircle size={15} className="shrink-0" />{error}
        </div>
      )}

      {/* Exam dropdown */}
      <div className="mb-4 relative">
        <label className="block text-xs font-medium mb-2" style={{ color: '#B0B0C8' }}>Prüfung auswählen</label>
        {examsLoading ? (
          <div className="h-11 rounded-xl animate-pulse" style={{ backgroundColor: '#1A1A24' }} />
        ) : exams.length === 0 ? (
          <p className="text-sm py-3 text-center" style={{ color: '#6060A0' }}>
            Keine weiteren Prüfungen vorhanden.
          </p>
        ) : (
          <>
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors"
              style={{
                backgroundColor: '#0F0F14',
                border: `1px solid ${dropdownOpen ? '#7C6FFF' : '#2A2A3A'}`,
                color: selectedExam ? '#E8E8F0' : '#6060A0',
              }}
            >
              <span className="flex items-center gap-2">
                {selectedExam && (
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedExam.color }} />
                )}
                {selectedExam ? selectedExam.name : 'Prüfung wählen…'}
              </span>
              <ChevronDown
                size={16}
                style={{
                  color: '#6060A0',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                }}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
                >
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => { setSelectedExamId(exam.id); setDropdownOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors hover:brightness-125"
                      style={{
                        color: exam.id === selectedExamId ? '#E8E8F0' : '#9090A8',
                        backgroundColor: exam.id === selectedExamId ? '#22223A' : 'transparent',
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: exam.color }} />
                      {exam.name}
                      {exam.id === selectedExamId && <Check size={14} className="ml-auto" style={{ color: '#7C6FFF' }} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Card list */}
      <AnimatePresence>
        {selectedExamId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            {cardsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: '#1A1A24' }} />
                ))}
              </div>
            ) : sourceCards.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: '#6060A0' }}>
                Diese Prüfung hat noch keine Karteikarten.
              </p>
            ) : (
              <>
                {/* Select all toggle */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium" style={{ color: '#B0B0C8' }}>
                    {sourceCards.length} {sourceCards.length === 1 ? 'Karte' : 'Karten'}
                  </p>
                  <button
                    onClick={toggleAll}
                    className="text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ color: '#7C6FFF' }}
                  >
                    {checked.size === sourceCards.length ? 'Keine' : 'Alle auswählen'}
                  </button>
                </div>

                <div
                  className="rounded-xl overflow-hidden overflow-y-auto max-h-52"
                  style={{ border: '1px solid #2A2A3A' }}
                >
                  {sourceCards.map((card, i) => (
                    <button
                      key={card.id}
                      onClick={() => toggleCard(card.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-110"
                      style={{
                        backgroundColor: i % 2 === 0 ? '#0F0F14' : '#12121A',
                        borderBottom: i < sourceCards.length - 1 ? '1px solid #1A1A24' : 'none',
                      }}
                    >
                      {/* Checkbox */}
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          backgroundColor: checked.has(card.id) ? '#7C6FFF' : 'transparent',
                          border: `1.5px solid ${checked.has(card.id) ? '#7C6FFF' : '#3A3A4A'}`,
                        }}
                      >
                        {checked.has(card.id) && <Check size={10} color="#fff" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs truncate" style={{ color: '#E8E8F0' }}>{card.front}</span>
                        <span className="block text-xs truncate mt-0.5" style={{ color: '#6060A0' }}>{card.back}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1A1A24', color: '#9090A8', border: '1px solid #2A2A3A' }}
        >
          Abbrechen
        </button>
        <button
          onClick={handleImport}
          disabled={saving || checked.size === 0}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{
            backgroundColor: '#7C6FFF',
            opacity: saving || checked.size === 0 ? 0.5 : 1,
            cursor: saving || checked.size === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {saving
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />Importieren…</span>
            : checked.size > 0 ? `${checked.size} ${checked.size === 1 ? 'Karte' : 'Karten'} importieren` : 'Importieren'}
        </button>
      </div>
    </>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function BulkImportModal({ examId, onClose, onImported }: Props) {
  const [mode, setMode] = useState<Mode>('exam')

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="w-full max-w-lg rounded-2xl p-7"
        style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: '#E8E8F0' }}>Karten importieren</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-60" style={{ color: '#6060A0' }}>
            <X size={20} />
          </button>
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-xl p-1 mb-5"
          style={{ backgroundColor: '#0F0F14', border: '1px solid #2A2A3A' }}
        >
          {(['exam', 'text'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: mode === m ? '#7C6FFF' : 'transparent',
                color: mode === m ? '#fff' : '#6060A0',
              }}
            >
              {m === 'exam' ? 'Aus Prüfung' : 'Text eingeben'}
            </button>
          ))}
        </div>

        {mode === 'exam' ? (
          <ExamTab currentExamId={examId} onImported={onImported} onClose={onClose} />
        ) : (
          <TextTab examId={examId} onImported={onImported} onClose={onClose} />
        )}
      </motion.div>
    </motion.div>
  )
}
