import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CalendarDays, AlertCircle, ChevronRight, Zap } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import NewExamModal, { type Exam } from '../components/NewExamModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl animate-pulse ${className ?? ''}`} style={{ backgroundColor: '#1A1A24' }} />
  )
}

// ─── Exam Card ────────────────────────────────────────────────────────────────

function ExamCard({ exam, onClick }: { exam: Exam; onClick: () => void }) {
  const days = daysUntil(exam.exam_date)
  const isUrgent = days <= 3
  const isWarning = days <= 7
  const countdownColor = isWarning ? '#F87171' : '#9090A8'
  const countdownText =
    days < 0 ? 'Vorbei' : days === 0 ? 'Heute!' : `in ${days} Tag${days === 1 ? '' : 'en'}`

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl p-5 text-left transition-colors hover:brightness-110"
      style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
    >
      {/* Farb-Akzent */}
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: exam.color }} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate" style={{ color: '#E8E8F0' }}>{exam.name}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6060A0' }}>
          {new Date(exam.exam_date).toLocaleDateString('de-DE', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Countdown */}
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

      <ChevronRight size={16} style={{ color: '#3A3A4A', flexShrink: 0 }} />
    </motion.button>
  )
}

// ─── Upgrade-Hinweis ──────────────────────────────────────────────────────────

function UpgradeBanner({ onClose }: { onClose: () => void }) {
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
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'rgba(124,111,255,0.15)' }}
        >
          <Zap size={26} style={{ color: '#7C6FFF' }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#E8E8F0' }}>
          Free-Limit erreicht
        </h2>
        <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
          Im Free-Plan ist maximal 1 Prüfung möglich. Upgrade auf Premium für unbegrenzte Prüfungen.
        </p>
        <button
          className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-3 transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#7C6FFF' }}
        >
          Upgrade auf Premium
        </button>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: '#6060A0' }}
        >
          Schließen
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Seite ────────────────────────────────────────────────────────────────────

export default function Exams() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [exams, setExams] = useState<Exam[]>([])
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const [examsRes, profileRes] = await Promise.all([
          supabase
            .from('exams')
            .select('id, name, exam_date, color, difficulty')
            .eq('user_id', user!.id)
            .order('exam_date', { ascending: true }),
          supabase
            .from('user_profiles')
            .select('plan')
            .eq('id', user!.id)
            .single(),
        ])
        if (examsRes.error) throw examsRes.error
        setExams((examsRes.data ?? []) as Exam[])
        setPlan(profileRes.data?.plan ?? 'free')
      } catch {
        setError('Prüfungen konnten nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleNewExamClick = () => {
    if (plan === 'free' && exams.length >= 1) {
      setShowUpgrade(true)
    } else {
      setShowModal(true)
    }
  }

  const handleCreated = (exam: Exam) => {
    setExams((prev) =>
      [...prev, exam].sort(
        (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime(),
      ),
    )
  }

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-8 max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <CalendarDays size={22} style={{ color: '#7C6FFF' }} />
            <h1 className="text-xl font-bold" style={{ color: '#E8E8F0' }}>Deine Prüfungen</h1>
          </div>
          <button
            onClick={handleNewExamClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#7C6FFF' }}
          >
            <Plus size={16} />
            Neue Prüfung
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl p-4 mb-6 text-sm"
            style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}>
            <AlertCircle size={16} className="shrink-0" />{error}
          </div>
        )}

        {/* Liste */}
        <div className="space-y-3">
          <AnimatePresence>
            {exams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-2xl py-16 px-8 text-center"
                style={{ backgroundColor: '#16161F', border: '1px dashed #2A2A3A' }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#1A1A24' }}
                >
                  <CalendarDays size={28} style={{ color: '#3A3A4A' }} />
                </div>
                <p className="font-semibold mb-2" style={{ color: '#E8E8F0' }}>
                  Noch keine Prüfungen
                </p>
                <p className="text-sm mb-6" style={{ color: '#6060A0' }}>
                  Trage deine erste Prüfung ein und behalte den Überblick.
                </p>
                <button
                  onClick={handleNewExamClick}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#7C6FFF' }}
                >
                  <Plus size={16} />
                  Erste Prüfung anlegen
                </button>
              </motion.div>
            ) : (
              exams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  onClick={() => navigate(`/exams/${exam.id}`)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Free-Plan-Hinweis */}
        {plan === 'free' && exams.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-xl p-4 mt-6"
            style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
          >
            <Zap size={16} style={{ color: '#7C6FFF', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: '#6060A0' }}>
              Free-Plan: {exams.length}/1 Prüfung.{' '}
              <button
                className="font-medium underline"
                style={{ color: '#7C6FFF' }}
                onClick={() => setShowUpgrade(true)}
              >
                Upgrade für unbegrenzte Prüfungen
              </button>
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <NewExamModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
        )}
        {showUpgrade && (
          <UpgradeBanner onClose={() => setShowUpgrade(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
