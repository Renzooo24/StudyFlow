import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  onImported: (cards: Card[]) => void
}

interface ParsedRow {
  front: string
  back: string
}

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

export default function BulkImportModal({ examId, onClose, onImported }: Props) {
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold" style={{ color: '#E8E8F0' }}>Mehrere importieren</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-60" style={{ color: '#6060A0' }}>
            <X size={20} />
          </button>
        </div>

        <p className="text-xs mb-5" style={{ color: '#6060A0' }}>
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
          rows={8}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-5"
          style={{
            backgroundColor: '#0F0F14',
            border: '1px solid #2A2A3A',
            color: '#E8E8F0',
          }}
        />

        {/* Vorschau */}
        <AnimatePresence>
          {parsed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <p className="text-xs font-medium mb-2" style={{ color: '#B0B0C8' }}>
                Vorschau — {parsed.length} {parsed.length === 1 ? 'Karte' : 'Karten'} erkannt
              </p>
              <div
                className="rounded-xl overflow-hidden max-h-48 overflow-y-auto"
                style={{ border: '1px solid #2A2A3A' }}
              >
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

        <div className="flex gap-3">
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
      </motion.div>
    </motion.div>
  )
}
