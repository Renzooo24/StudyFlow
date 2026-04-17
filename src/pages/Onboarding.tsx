import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Loader2, Star, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface FormData {
  // Schritt 1
  name: string
  university: string
  studyProgram: string
  semester: number
  // Schritt 2
  examName: string
  examDate: string
  examDifficulty: number
}

const TOTAL_STEPS = 3

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100)
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs mb-2" style={{ color: '#9090A8' }}>
        <span>Schritt {current} von {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#2A2A3A' }}>
        <motion.div
          className="h-1.5 rounded-full"
          style={{ backgroundColor: '#7C6FFF' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
        {label}
        {optional && <span className="text-xs font-normal" style={{ color: '#6060A0' }}>(optional)</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = (focused: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#1A1A22',
  border: `1px solid ${focused ? '#7C6FFF' : '#2A2A3A'}`,
  color: '#E8E8F0',
  transition: 'border-color 0.15s',
})

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-2 mt-1">
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
            size={28}
            fill={(hovered || value) >= star ? '#7C6FFF' : 'transparent'}
            stroke={(hovered || value) >= star ? '#7C6FFF' : '#3A3A4A'}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="ml-2 text-sm self-center" style={{ color: '#9090A8' }}>
        {['', 'Sehr leicht', 'Leicht', 'Mittel', 'Schwer', 'Sehr schwer'][hovered || value]}
      </span>
    </div>
  )
}

// ─── Slide-Animation ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function Onboarding() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    university: '',
    studyProgram: '',
    semester: 1,
    examName: '',
    examDate: '',
    examDifficulty: 3,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function loadProfile() {
      const { data } = await supabase
        .from('user_profiles')
        .select('name, university, study_program, semester')
        .eq('id', user!.id)
        .single()

      if (data?.university) {
        navigate('/dashboard', { replace: true })
        return
      }

      setFormData((prev) => ({
        ...prev,
        name: data?.name ?? user!.user_metadata?.full_name ?? '',
        studyProgram: data?.study_program ?? '',
        semester: data?.semester ?? 1,
      }))
      setLoading(false)
    }
    loadProfile()
  }, [user, navigate])

  const goTo = (step: number) => {
    setDirection(step > currentStep ? 1 : -1)
    setCurrentStep(step)
  }

  const handleFinish = async () => {
    setSaveError(null)
    setSubmitting(true)
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user!.id,
          name: formData.name.trim() || (user!.user_metadata?.full_name ?? ''),
          university: formData.university.trim() || null,
          study_program: formData.studyProgram.trim() || null,
          semester: formData.semester,
        })

      if (profileError) throw profileError

      if (formData.examName.trim() && formData.examDate) {
        const { error: examError } = await supabase
          .from('exams')
          .insert({
            user_id: user!.id,
            name: formData.examName.trim(),
            exam_date: formData.examDate,
            color: '#7C6FFF',
          })

        if (examError) throw examError
      }

      navigate('/dashboard', { replace: true })
    } catch {
      setSaveError('Fehler beim Speichern. Bitte versuche es erneut.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0F14' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#7C6FFF' }} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#7C6FFF' }}
          >
            <BookOpen size={28} color="#ffffff" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#7C6FFF' }}>
            StudyFlow
          </h1>
        </div>

        <ProgressBar current={currentStep} total={TOTAL_STEPS} />

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {currentStep === 1 && (
              <Step1
                formData={formData}
                setFormData={setFormData}
                submitting={submitting}
                onNext={() => goTo(2)}
              />
            )}
            {currentStep === 2 && (
              <Step2
                formData={formData}
                setFormData={setFormData}
                submitting={submitting}
                onBack={() => goTo(1)}
                onNext={() => goTo(3)}
                onSkip={() => goTo(3)}
              />
            )}
            {currentStep === 3 && (
              <Step3
                examName={formData.examName}
                submitting={submitting}
                error={saveError}
                onFinish={handleFinish}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Schritt 1: Profil ────────────────────────────────────────────────────────

function Step1({
  formData, setFormData, submitting, onNext,
}: {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  submitting: boolean
  onNext: () => void
}) {
  const [focused, setFocused] = useState<string | null>(null)

  return (
    <div className="rounded-2xl p-8" style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#E8E8F0' }}>Erzähl uns von dir 👋</h2>
      <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
        Diese Angaben helfen uns, StudyFlow für dich anzupassen.
      </p>

      <div className="space-y-5">
        <Field label="Vorname">
          <input
            type="text"
            autoComplete="given-name"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            placeholder="Max"
            style={inputStyle(focused === 'name')}
          />
        </Field>
        <Field label="Hochschule" optional>
          <input
            type="text"
            value={formData.university}
            onChange={(e) => setFormData((p) => ({ ...p, university: e.target.value }))}
            onFocus={() => setFocused('university')}
            onBlur={() => setFocused(null)}
            placeholder="z.B. TU München"
            style={inputStyle(focused === 'university')}
          />
        </Field>
        <Field label="Studiengang" optional>
          <input
            type="text"
            value={formData.studyProgram}
            onChange={(e) => setFormData((p) => ({ ...p, studyProgram: e.target.value }))}
            onFocus={() => setFocused('studyProgram')}
            onBlur={() => setFocused(null)}
            placeholder="z.B. Informatik B.Sc."
            style={inputStyle(focused === 'studyProgram')}
          />
        </Field>
        <Field label="Semester">
          <select
            value={formData.semester}
            onChange={(e) => setFormData((p) => ({ ...p, semester: Number(e.target.value) }))}
            onFocus={() => setFocused('semester')}
            onBlur={() => setFocused(null)}
            style={inputStyle(focused === 'semester')}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
              <option key={s} value={s} style={{ backgroundColor: '#1A1A22' }}>
                {s}. Semester
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button
        onClick={onNext}
        disabled={submitting}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-8 transition-opacity"
        style={{ backgroundColor: '#7C6FFF', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        Weiter →
      </button>
    </div>
  )
}

// ─── Schritt 2: Erste Prüfung ─────────────────────────────────────────────────

function Step2({
  formData, setFormData, submitting, onBack, onNext, onSkip,
}: {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  submitting: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}) {
  const [focused, setFocused] = useState<string | null>(null)
  const canSubmit = formData.examName.trim().length > 0 && formData.examDate.length > 0

  return (
    <div className="rounded-2xl p-8" style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#E8E8F0' }}>Deine erste Prüfung 📅</h2>
      <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
        Was steht als Nächstes an?
      </p>

      <div className="space-y-5">
        <Field label="Fachname">
          <input
            type="text"
            value={formData.examName}
            onChange={(e) => setFormData((p) => ({ ...p, examName: e.target.value }))}
            onFocus={() => setFocused('examName')}
            onBlur={() => setFocused(null)}
            placeholder="z.B. Mathematik II"
            style={inputStyle(focused === 'examName')}
          />
        </Field>

        <Field label="Prüfungsdatum">
          <input
            type="date"
            value={formData.examDate}
            onChange={(e) => setFormData((p) => ({ ...p, examDate: e.target.value }))}
            onFocus={() => setFocused('examDate')}
            onBlur={() => setFocused(null)}
            min={new Date().toISOString().split('T')[0]}
            style={{ ...inputStyle(focused === 'examDate'), colorScheme: 'dark' }}
          />
        </Field>

        <Field label="Schwierigkeit">
          <StarRating
            value={formData.examDifficulty}
            onChange={(v) => setFormData((p) => ({ ...p, examDifficulty: v }))}
          />
        </Field>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#1A1A22', color: '#9090A8', border: '1px solid #2A2A3A' }}
        >
          ← Zurück
        </button>
        <button
          onClick={onNext}
          disabled={submitting || !canSubmit}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{
            backgroundColor: '#7C6FFF',
            opacity: submitting || !canSubmit ? 0.5 : 1,
            cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer',
          }}
        >
          Weiter →
        </button>
      </div>

      <button
        onClick={onSkip}
        className="w-full py-2.5 text-sm mt-3 transition-opacity hover:opacity-80"
        style={{ color: '#6060A0' }}
      >
        Überspringen
      </button>
    </div>
  )
}

// ─── Schritt 3: Abschluss ─────────────────────────────────────────────────────

function Step3({
  examName, submitting, error, onFinish,
}: {
  examName: string
  submitting: boolean
  error: string | null
  onFinish: () => void
}) {
  return (
    <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.1 }}
        className="flex justify-center mb-6"
        style={{ fontSize: '72px', lineHeight: 1 }}
      >
        🎉
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#E8E8F0' }}>
          Willkommen bei StudyFlow!
        </h2>
        <p className="text-sm mb-8" style={{ color: '#9090A8' }}>
          {examName.trim()
            ? `Wir helfen dir, ${examName.trim()} zu meistern. Lass uns starten!`
            : 'Dein Profil ist eingerichtet. Lass uns starten!'}
        </p>
      </motion.div>

      {error && (
        <motion.div
          className="flex items-center gap-2 rounded-xl p-3 mb-5 text-sm"
          style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </motion.div>
      )}

      <motion.button
        onClick={onFinish}
        disabled={submitting}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity"
        style={{
          backgroundColor: '#7C6FFF',
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Wird gespeichert…
          </span>
        ) : (
          'Zum Dashboard →'
        )}
      </motion.button>
    </div>
  )
}
