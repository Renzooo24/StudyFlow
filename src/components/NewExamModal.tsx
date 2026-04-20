import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, AlertCircle, Loader2, Star } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

export interface Exam {
  id: string
  name: string
  exam_date: string
  color: string
  difficulty: number
}

const COLORS = ['#7C6FFF', '#FF6F7C', '#6FFFAA', '#FFD06F', '#6FC8FF', '#FF9F6F']

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'Sehr leicht', 'Leicht', 'Mittel', 'Schwer', 'Sehr schwer']
  return (
    <div className="flex items-center gap-2 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={26}
            fill={(hovered || value) >= star ? '#7C6FFF' : 'transparent'}
            stroke={(hovered || value) >= star ? '#7C6FFF' : '#3A3A4A'}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="text-sm ml-1" style={{ color: '#9090A8' }}>
        {labels[hovered || value]}
      </span>
    </div>
  )
}

interface Props {
  onClose: () => void
  onCreated: (exam: Exam) => void
}

export default function NewExamModal({ onClose, onCreated }: Props) {
  const { user } = useAuthStore()
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [color, setColor] = useState('#7C6FFF')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  const canSave = name.trim().length > 0 && date.length > 0

  const handleSave = async () => {
    if (!canSave || !user) return
    setSaving(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('exams')
        .insert({
          user_id: user.id,
          name: name.trim(),
          exam_date: date,
          color,
          difficulty,
        })
        .select()
        .single()
      if (dbError) throw dbError
      onCreated(data as Exam)
      onClose()
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#E8E8F0' }}>Neue Prüfung</h2>
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
          {/* Fachname */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
              Fachname
            </label>
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

          {/* Datum */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
              Prüfungsdatum
            </label>
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
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Schwierigkeit */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
              Schwierigkeit
            </label>
            <StarRating value={difficulty} onChange={setDifficulty} />
          </div>

          {/* Farbe */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#B0B0C8' }}>
              Farbe
            </label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
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

        {/* Buttons */}
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
              ? <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />Anlegen…
                </span>
              : 'Anlegen'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
