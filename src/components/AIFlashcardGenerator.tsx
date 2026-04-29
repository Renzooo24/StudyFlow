import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2, AlertCircle, Zap, Image } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

interface Card {
  id: string
  front: string
  back: string
  next_review: string
}

interface GeneratedCard {
  front: string
  back: string
}

interface Props {
  examId: string
  plan: string
  onClose: () => void
  onCardsAdded: (cards: Card[]) => void
}

const COUNT_OPTIONS = [5, 10, 20, 50] as const
type CountOption = typeof COUNT_OPTIONS[number]
type Difficulty = 'einfach' | 'mittel' | 'schwer'
type Phase = 'input' | 'loading' | 'preview'

const FREE_MONTHLY_LIMIT = 3
const CONTENT_MIN = 100
const CONTENT_MAX = 5000
const DIFFICULTIES: Difficulty[] = ['einfach', 'mittel', 'schwer']
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  einfach: 'Einfach',
  mittel: 'Mittel',
  schwer: 'Schwer',
}

export default function AIFlashcardGenerator({ examId, plan, onClose, onCardsAdded }: Props) {
  const navigate = useNavigate()
  const { session, user } = useAuthStore()

  const [content, setContent] = useState('')
  const [count, setCount] = useState<CountOption>(10)
  const [difficulty, setDifficulty] = useState<Difficulty>('mittel')
  const [phase, setPhase] = useState<Phase>('input')
  const [cards, setCards] = useState<GeneratedCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [usedCount, setUsedCount] = useState<number | null>(null)

  useEffect(() => {
    async function loadUsage() {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const { count: used } = await supabase
        .from('ai_generations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
      setUsedCount(used ?? 0)
    }
    loadUsage()
  }, [])

  const isAtLimit = plan !== 'premium' && (usedCount ?? 0) >= FREE_MONTHLY_LIMIT
  const contentOk = content.trim().length >= CONTENT_MIN

  const generate = async () => {
    if (!contentOk || isAtLimit || !session) return
    setPhase('loading')
    setError(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: content.trim(), count, examId, difficulty }),
      })

      if (res.status === 403) {
        setUsedCount(FREE_MONTHLY_LIMIT)
        setError('limit')
        setPhase('input')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>
        const msg = (body.error ?? body.message ?? body.msg) as string | undefined
        throw new Error(msg ? String(msg) : `Serverfehler (${res.status})`)
      }

      const data = await res.json() as { cards: GeneratedCard[] }
      setCards(data.cards)
      setUsedCount((prev) => (prev !== null ? prev + 1 : FREE_MONTHLY_LIMIT))
      setPhase('preview')
    } catch (err) {
      if (err instanceof TypeError) {
        setError('network')
      } else {
        setError((err as Error).message || 'Ein unerwarteter Fehler ist aufgetreten.')
      }
      setPhase('input')
    }
  }

  const updateCard = (i: number, field: 'front' | 'back', value: string) => {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)))
  }

  const removeCard = (i: number) => {
    setCards((prev) => prev.filter((_, idx) => idx !== i))
  }

  const saveAll = async () => {
    if (!user || cards.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const rows = cards.map((c) => ({
        exam_id: examId,
        user_id: user.id,
        front: c.front.trim(),
        back: c.back.trim(),
        interval: 1,
        easiness_factor: 2.5,
        repetitions: 0,
        next_review: today,
      }))
      const { data, error: dbError } = await supabase
        .from('flashcards')
        .insert(rows)
        .select('id, front, back, next_review')
      if (dbError) throw dbError
      onCardsAdded((data ?? []) as Card[])
      onClose()
    } catch {
      setError('Fehler beim Speichern der Karten. Bitte versuche es erneut.')
      setSaving(false)
    }
  }

  const errorMessage =
    error === 'limit'
      ? 'Du hast dein monatliches Limit erreicht. Upgrade auf Premium für unbegrenzte Generierungen.'
      : error === 'network'
      ? 'Verbindung fehlgeschlagen. Bitte versuche es erneut.'
      : (error ?? '')

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: '#16161F',
          border: '1px solid #2A2A3A',
          maxHeight: '90vh',
        }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0"
          style={{ borderBottom: '1px solid #1A1A24' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#7C6FFF' }} />
            <h2 className="text-lg font-bold" style={{ color: '#E8E8F0' }}>
              KI-Karten generieren
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:opacity-60 transition-opacity"
            style={{ color: '#6060A0' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Tabs */}
          <div className="flex rounded-xl p-1" style={{ backgroundColor: '#0F0F14' }}>
            <button
              className="flex-1 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#7C6FFF', color: '#ffffff' }}
            >
              Text eingeben
            </button>
            <button
              disabled
              className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
              style={{ color: '#3A3A5A', cursor: 'not-allowed' }}
            >
              <Image size={13} />
              Foto / Datei
            </button>
          </div>

          {/* Free-limit banner */}
          {usedCount !== null && plan !== 'premium' && (
            <div
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                backgroundColor: isAtLimit ? '#2D1B1B' : '#1A1A24',
                border: `1px solid ${isAtLimit ? '#5C2D2D' : '#2A2A3A'}`,
              }}
            >
              <Zap
                size={14}
                style={{ color: isAtLimit ? '#F87171' : '#7C6FFF', flexShrink: 0 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: isAtLimit ? '#F87171' : '#9090A8' }}>
                  {usedCount} / {FREE_MONTHLY_LIMIT} Generierungen diesen Monat verbraucht
                </p>
                {isAtLimit && (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-xs font-semibold mt-0.5 underline"
                    style={{ color: '#F87171' }}
                  >
                    Upgrade auf Premium
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && phase === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-xl p-3 text-sm"
              style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* ── Input phase ── */}
          {phase === 'input' && (
            <>
              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: '#B0B0C8' }}>
                    Lerninhalt
                  </label>
                  <span
                    className="text-xs"
                    style={{
                      color: content.length > CONTENT_MAX * 0.9 ? '#F87171' : '#6060A0',
                    }}
                  >
                    {content.length} / {CONTENT_MAX}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                  placeholder="Füge hier deinen Text ein (Vorlesung, Skript, Notizen...)"
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{
                    backgroundColor: '#0F0F14',
                    border: '1px solid #2A2A3A',
                    color: '#E8E8F0',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7C6FFF')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A3A')}
                />
                {content.length > 0 && content.trim().length < CONTENT_MIN && (
                  <p className="text-xs mt-1.5" style={{ color: '#6060A0' }}>
                    Noch {CONTENT_MIN - content.trim().length} Zeichen bis zum Minimum
                  </p>
                )}
              </div>

              {/* Count selector */}
              <div>
                <p className="text-sm font-medium mb-2.5" style={{ color: '#B0B0C8' }}>
                  Anzahl Karten
                </p>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: count === n ? '#7C6FFF' : '#0F0F14',
                        color: count === n ? '#ffffff' : '#6060A0',
                        border: `1px solid ${count === n ? '#7C6FFF' : '#2A2A3A'}`,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty selector */}
              <div>
                <p className="text-sm font-medium mb-2.5" style={{ color: '#B0B0C8' }}>
                  Schwierigkeit
                </p>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: difficulty === d ? '#7C6FFF' : '#0F0F14',
                        color: difficulty === d ? '#ffffff' : '#6060A0',
                        border: `1px solid ${difficulty === d ? '#7C6FFF' : '#2A2A3A'}`,
                      }}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={!contentOk || isAtLimit}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
                style={{
                  backgroundColor: '#7C6FFF',
                  opacity: !contentOk || isAtLimit ? 0.4 : 1,
                  cursor: !contentOk || isAtLimit ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles size={16} />
                Karten generieren
              </button>
            </>
          )}

          {/* ── Loading phase ── */}
          {phase === 'loading' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Loader2 size={16} className="animate-spin" style={{ color: '#7C6FFF' }} />
                <p className="text-sm" style={{ color: '#9090A8' }}>
                  Generiere… das dauert 5–15 Sekunden
                </p>
              </div>
              <div className="space-y-3">
                {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 space-y-2.5 animate-pulse"
                    style={{ backgroundColor: '#1A1A24' }}
                  >
                    <div
                      className="h-3 rounded-full"
                      style={{ backgroundColor: '#2A2A3A', width: `${65 + (i % 3) * 10}%` }}
                    />
                    <div
                      className="h-3 rounded-full"
                      style={{ backgroundColor: '#2A2A3A', width: `${40 + (i % 4) * 8}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Preview phase ── */}
          {phase === 'preview' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>
                  {cards.length} Karte{cards.length !== 1 ? 'n' : ''} generiert
                </p>
                <button
                  onClick={() => { setPhase('input'); setError(null) }}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: '#7C6FFF' }}
                >
                  Neu generieren
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
                  style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}
                >
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              <div className="space-y-3 mb-5">
                <AnimatePresence>
                  {cards.map((card, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="rounded-xl p-4"
                      style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold" style={{ color: '#6060A0' }}>
                          Karte {i + 1}
                        </span>
                        <button
                          onClick={() => removeCard(i)}
                          className="p-0.5 rounded hover:opacity-60 transition-opacity"
                          style={{ color: '#6060A0' }}
                          aria-label="Karte entfernen"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        value={card.front}
                        onChange={(e) => updateCard(i, 'front', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none mb-2 font-medium"
                        style={{
                          backgroundColor: '#0F0F14',
                          border: '1px solid #2A2A3A',
                          color: '#E8E8F0',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#7C6FFF')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A3A')}
                      />
                      <textarea
                        value={card.back}
                        onChange={(e) => updateCard(i, 'back', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                        style={{
                          backgroundColor: '#0F0F14',
                          border: '1px solid #2A2A3A',
                          color: '#9090A8',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#7C6FFF')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A3A')}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: '#1A1A24',
                    color: '#9090A8',
                    border: '1px solid #2A2A3A',
                  }}
                >
                  Verwerfen
                </button>
                <button
                  onClick={saveAll}
                  disabled={saving || cards.length === 0}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    backgroundColor: '#7C6FFF',
                    opacity: saving || cards.length === 0 ? 0.6 : 1,
                    cursor: saving || cards.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Speichern…
                    </>
                  ) : (
                    `${cards.length} Karte${cards.length !== 1 ? 'n' : ''} speichern`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
