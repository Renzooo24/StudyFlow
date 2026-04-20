import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronRight, CheckCircle2, CalendarDays } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

interface ExamWithDue {
  id: string
  name: string
  color: string
  exam_date: string
  dueCount: number
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl animate-pulse ${className ?? ''}`} style={{ backgroundColor: '#1A1A24' }} />
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export default function StudyOverview() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [exams, setExams] = useState<ExamWithDue[]>([])
  const [totalDue, setTotalDue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const today = new Date().toISOString().split('T')[0]

      // Alle Prüfungen + fällige Karten pro Prüfung
      const { data: examData } = await supabase
        .from('exams')
        .select('id, name, color, exam_date')
        .eq('user_id', user!.id)
        .order('exam_date', { ascending: true })

      if (!examData || examData.length === 0) {
        setLoading(false)
        return
      }

      // Für jede Prüfung fällige Karten zählen
      const counts = await Promise.all(
        examData.map((exam) =>
          supabase
            .from('flashcards')
            .select('id', { count: 'exact', head: true })
            .eq('exam_id', exam.id)
            .lte('next_review', today)
            .then(({ count }) => ({ examId: exam.id, count: count ?? 0 })),
        ),
      )

      const countMap = Object.fromEntries(counts.map((c) => [c.examId, c.count]))
      const withDue: ExamWithDue[] = examData
        .map((e) => ({ ...e, dueCount: countMap[e.id] ?? 0 }))
        .filter((e) => e.dueCount > 0)

      setExams(withDue)
      setTotalDue(withDue.reduce((sum, e) => sum + e.dueCount, 0))
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
        <Skeleton className="h-7 w-36 mb-2" />
        <Skeleton className="h-4 w-48 mb-8" />
        <Skeleton className="h-28 w-full mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-8 max-w-lg mx-auto" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <Brain size={22} style={{ color: '#7C6FFF' }} />
        <h1 className="text-xl font-bold" style={{ color: '#E8E8F0' }}>Lernen</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: '#6060A0' }}>
        {totalDue > 0
          ? `${totalDue} Karte${totalDue !== 1 ? 'n' : ''} warten auf dich`
          : 'Heute alles erledigt'}
      </p>

      <AnimatePresence mode="wait">
        {exams.length === 0 ? (
          /* Leer-Zustand */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl py-16 px-8 text-center"
            style={{ backgroundColor: '#16161F', border: '1px dashed #2A2A3A' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: '#1A1A24' }}
            >
              <CheckCircle2 size={28} style={{ color: '#7C6FFF' }} />
            </div>
            <p className="font-semibold mb-2" style={{ color: '#E8E8F0' }}>Heute keine Karten fällig</p>
            <p className="text-sm mb-6" style={{ color: '#6060A0' }}>
              Du bist auf dem neuesten Stand. Schau morgen wieder vorbei!
            </p>
            <button
              onClick={() => navigate('/exams')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#7C6FFF' }}
            >
              <CalendarDays size={15} />
              Zu den Prüfungen
            </button>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-3">
            {exams.map((exam, i) => {
              const days = daysUntil(exam.exam_date)
              const countdownText =
                days < 0 ? 'Vorbei' : days === 0 ? 'Heute!' : `in ${days} Tag${days === 1 ? '' : 'en'}`
              const urgent = days >= 0 && days <= 7

              return (
                <motion.button
                  key={exam.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/study/${exam.id}`)}
                  className="w-full flex items-center gap-4 rounded-2xl p-5 text-left transition-colors hover:brightness-110"
                  style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
                >
                  {/* Farb-Akzent */}
                  <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: exam.color }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: '#E8E8F0' }}>{exam.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: urgent ? '#F87171' : '#6060A0' }}>
                      Prüfung {countdownText}
                    </p>
                  </div>

                  {/* Karten-Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-sm font-bold px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: 'rgba(124,111,255,0.15)', color: '#7C6FFF' }}
                    >
                      {exam.dueCount} {exam.dueCount === 1 ? 'Karte' : 'Karten'}
                    </span>
                    <ChevronRight size={16} style={{ color: '#3A3A4A' }} />
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
