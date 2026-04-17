import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Loader2, CheckCircle2 } from 'lucide-react'
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
  examColor: string
}

// ─── Konstanten ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3

const EXAM_COLORS = [
  { value: '#7C6FFF', label: 'Lila' },
  { value: '#FF6B6B', label: 'Rot' },
  { value: '#4ECDC4', label: 'Türkis' },
  { value: '#45B7D1', label: 'Blau' },
  { value: '#96CEB4', label: 'Grün' },
  { value: '#FFEAA7', label: 'Gelb' },
  { value: '#FF8B94', label: 'Rosa' },
  { value: '#A29BFE', label: 'Violett' },
]

// ─── Fortschrittsbalken ───────────────────────────────────────────────────────

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

// ─── Eingabefeld ──────────────────────────────────────────────────────────────

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

// ─── Slide-Animation ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

// ─── Seite ────────────────────────────────────────────────────────────────────

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
    examColor: '#7C6FFF',
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // ─── Profil laden ──────────────────────────────────────────────────────────

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

  // ─── Navigation ────────────────────────────────────────────────────────────

  const goNext = () => {
    setDirection(1)
    setCurrentStep((s) => s + 1)
  }

  // ─── Schritt 1: Profil speichern ───────────────────────────────────────────

  const handleStep1 = async () => {
    setSubmitting(true)
    await supabase.from('user_profiles').upsert({
      id: user!.id,
      name: formData.name.trim() || (user!.user_metadata?.full_name ?? ''),
      university: formData.university.trim() || null,
      study_program: formData.studyProgram.trim() || null,
      semester: formData.semester,
    })
    setSubmitting(false)
    goNext()
  }

  // ─── Schritt 2: Prüfung speichern ─────────────────────────────────────────

  const handleStep2 = async (skip = false) => {
    if (!skip && formData.examName.trim() && formData.examDate) {
      setSubmitting(true)
      await supabase.from('exams').insert({
        user_id: user!.id,
        name: formData.examName.trim(),
        exam_date: formData.examDate,
        color: formData.examColor,
      })
      setSubmitting(false)
    }
    goNext()
  }

  // ─── Schritt 3: Abschluss ─────────────────────────────────────────────────

  const handleFinish = () => navigate('/dashboard', { replace: true })

  // ─── Ladescreen ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0F14' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#7C6FFF' }} />
      </div>
    )
  }

  // ─── Layout-Wrapper ───────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
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
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                submitting={submitting}
                onNext={handleStep1}
              />
            )}
            {currentStep === 2 && (
              <Step2
                formData={formData}
                setFormData={setFormData}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                submitting={submitting}
                onNext={() => handleStep2(false)}
                onSkip={() => handleStep2(true)}
              />
            )}
            {currentStep === 3 && (
              <Step3 examName={formData.examName} onFinish={handleFinish} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Schritt 1: Profil ────────────────────────────────────────────────────────

function Step1({
  formData, setFormData, focusedField, setFocusedField, submitting, onNext,
}: {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  submitting: boolean
  onNext: () => void
}) {
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
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="Max"
            style={inputStyle(focusedField === 'name')}
          />
        </Field>

        <Field label="Hochschule" optional>
          <input
            type="text"
            value={formData.university}
            onChange={(e) => setFormData((p) => ({ ...p, university: e.target.value }))}
            onFocus={() => setFocusedField('university')}
            onBlur={() => setFocusedField(null)}
            placeholder="z.B. TU München"
            style={inputStyle(focusedField === 'university')}
          />
        </Field>

        <Field label="Studiengang" optional>
          <input
            type="text"
            value={formData.studyProgram}
            onChange={(e) => setFormData((p) => ({ ...p, studyProgram: e.target.value }))}
            onFocus={() => setFocusedField('studyProgram')}
            onBlur={() => setFocusedField(null)}
            placeholder="z.B. Informatik B.Sc."
            style={inputStyle(focusedField === 'studyProgram')}
          />
        </Field>

        <Field label="Semester">
          <select
            value={formData.semester}
            onChange={(e) => setFormData((p) => ({ ...p, semester: Number(e.target.value) }))}
            onFocus={() => setFocusedField('semester')}
            onBlur={() => setFocusedField(null)}
            style={inputStyle(focusedField === 'semester')}
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
        {submitting
          ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Wird gespeichert…</span>
          : 'Weiter →'}
      </button>
    </div>
  )
}

// ─── Schritt 2: Erste Prüfung ─────────────────────────────────────────────────

function Step2({
  formData, setFormData, focusedField, setFocusedField, submitting, onNext, onSkip,
}: {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  focusedField: string | null
  setFocusedField: (f: string | null) => void
  submitting: boolean
  onNext: () => void
  onSkip: () => void
}) {
  const canSubmit = formData.examName.trim().length > 0 && formData.examDate.length > 0

  return (
    <div className="rounded-2xl p-8" style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}>
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#E8E8F0' }}>Deine erste Prüfung 📅</h2>
      <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
        Trag deine nächste Prüfung ein — du kannst später jederzeit mehr hinzufügen.
      </p>

      <div className="space-y-5">
        <Field label="Name der Prüfung">
          <input
            type="text"
            value={formData.examName}
            onChange={(e) => setFormData((p) => ({ ...p, examName: e.target.value }))}
            onFocus={() => setFocusedField('examName')}
            onBlur={() => setFocusedField(null)}
            placeholder="z.B. Mathematik I"
            style={inputStyle(focusedField === 'examName')}
          />
        </Field>

        <Field label="Prüfungsdatum">
          <input
            type="date"
            value={formData.examDate}
            onChange={(e) => setFormData((p) => ({ ...p, examDate: e.target.value }))}
            onFocus={() => setFocusedField('examDate')}
            onBlur={() => setFocusedField(null)}
            min={new Date().toISOString().split('T')[0]}
            style={{
              ...inputStyle(focusedField === 'examDate'),
              colorScheme: 'dark',
            }}
          />
        </Field>

        <Field label="Farbe">
          <div className="flex flex-wrap gap-3 mt-1">
            {EXAM_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, examColor: c.value }))}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c.value,
                  outline: formData.examColor === c.value ? `3px solid ${c.value}` : 'none',
                  outlineOffset: '2px',
                  transform: formData.examColor === c.value ? 'scale(1.15)' : 'scale(1)',
                }}
                title={c.label}
              />
            ))}
          </div>
        </Field>
      </div>

      <button
        onClick={onNext}
        disabled={submitting || !canSubmit}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-8 transition-opacity"
        style={{
          backgroundColor: '#7C6FFF',
          opacity: submitting || !canSubmit ? 0.5 : 1,
          cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting
          ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Wird gespeichert…</span>
          : 'Weiter →'}
      </button>

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

function Step3({ examName, onFinish }: { examName: string; onFinish: () => void }) {
  return (
    <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="flex justify-center mb-6"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#0F2D1B', border: '2px solid #4ADE80' }}
        >
          <CheckCircle2 size={40} color="#4ADE80" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold mb-2" style={{ color: '#E8E8F0' }}>
        Alles bereit! 🎉
      </h2>
      <p className="text-sm mb-2" style={{ color: '#9090A8' }}>
        Dein Profil ist eingerichtet.
      </p>
      {examName && (
        <p className="text-sm mb-8" style={{ color: '#9090A8' }}>
          Prüfung <span style={{ color: '#7C6FFF', fontWeight: 600 }}>„{examName}"</span> wurde hinzugefügt.
        </p>
      )}
      {!examName && <div className="mb-8" />}

      <motion.button
        onClick={onFinish}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white"
        style={{ backgroundColor: '#7C6FFF' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Zu StudyFlow →
      </motion.button>
    </div>
  )
}
