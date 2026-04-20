import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

interface Card {
  id: string
  front: string
  back: string
  next_review: string
}

interface Props {
  examId: string
  onClose: () => void
  onCreated: (card: Card) => void
}

const FRONT_MAX = 500
const BACK_MAX = 1000

export default function NewFlashcardModal({ examId, onClose, onCreated }: Props) {
  const { user } = useAuthStore()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  const canSave = front.trim().length > 0 && back.trim().length > 0

  const save = async (andClose: boolean) => {
    if (!canSave || !user) return
    setSaving(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('flashcards')
        .insert({ exam_id: examId, user_id: user.id, front: front.trim(), back: back.trim() })
        .select()
        .single()
      if (dbError) throw dbError
      onCreated(data as Card)
      if (andClose) {
        onClose()
      } else {
        setFront('')
        setBack('')
        setSaving(false)
      }
    } catch {
      setError('Fehler beim Speichern. Bitte versuche es erneut.')
      setSaving(false)
    }
  }

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
        className="w-full max-w-md rounded-2xl p-7"
        style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#E8E8F0' }}>Neue Karte</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-60" style={{ color: '#6060A0' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl p-3 mb-4 text-sm"
            style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}>
            <AlertCircle size={15} className="shrink-0" />{error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#B0B0C8' }}>Vorderseite</label>
              <span className="text-xs" style={{ color: front.length > FRONT_MAX * 0.9 ? '#F87171' : '#6060A0' }}>
                {front.length}/{FRONT_MAX}
              </span>
            </div>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value.slice(0, FRONT_MAX))}
              onFocus={() => setFocused('front')}
              onBlur={() => setFocused(null)}
              placeholder="Begriff oder Frage…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                backgroundColor: '#0F0F14',
                border: `1px solid ${focused === 'front' ? '#7C6FFF' : '#2A2A3A'}`,
                color: '#E8E8F0',
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: '#B0B0C8' }}>Rückseite</label>
              <span className="text-xs" style={{ color: back.length > BACK_MAX * 0.9 ? '#F87171' : '#6060A0' }}>
                {back.length}/{BACK_MAX}
              </span>
            </div>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value.slice(0, BACK_MAX))}
              onFocus={() => setFocused('back')}
              onBlur={() => setFocused(null)}
              placeholder="Antwort oder Erklärung…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                backgroundColor: '#0F0F14',
                border: `1px solid ${focused === 'back' ? '#7C6FFF' : '#2A2A3A'}`,
                color: '#E8E8F0',
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={() => save(false)}
            disabled={saving || !canSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity"
            style={{
              backgroundColor: '#1A1A24',
              color: saving || !canSave ? '#4A4A6A' : '#9090A8',
              border: '1px solid #2A2A3A',
              cursor: saving || !canSave ? 'not-allowed' : 'pointer',
            }}
          >
            {saving
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />…</span>
              : '& weitere'}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving || !canSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{
              backgroundColor: '#7C6FFF',
              opacity: saving || !canSave ? 0.5 : 1,
              cursor: saving || !canSave ? 'not-allowed' : 'pointer',
            }}
          >
            {saving
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />…</span>
              : 'Erstellen'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
