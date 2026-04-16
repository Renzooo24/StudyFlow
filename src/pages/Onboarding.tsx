import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string
  university: string
  studyProgram: string
  semester: number
}

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
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ─── Eingabefeld ──────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0C8' }}>
        {label}
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

// ─── Seite ────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3

export default function Onboarding() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    university: '',
    studyProgram: '',
    semester: 1,
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Profil laden – wenn university bereits gesetzt → direkt zum Dashboard
  useEffect(() => {
    if (!user) return

    async function loadProfile() {
      const { data } = await supabase
        .from('user_profiles')
        .select('name, university, study_program, semester')
        .eq('id', user!.id)
        .single()

      if (data?.university) {
        // Onboarding bereits abgeschlossen
        navigate('/dashboard', { replace: true })
        return
      }

      // Vorname vorbelegen falls vorhanden
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

  const handleNext = async () => {
    if (currentStep === 1) {
      setSubmitting(true)

      // Profil-Daten zwischenspeichern (noch nicht finalisieren)
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user!.id,
          name: formData.name.trim() || (user!.user_metadata?.full_name ?? ''),
          university: formData.university.trim() || null,
          study_program: formData.studyProgram.trim() || null,
          semester: formData.semester,
        })

      setSubmitting(false)

      if (error) {
        console.error('Profil speichern fehlgeschlagen:', error.message)
      }

      // Schritt 2 (kommt morgen)
      setCurrentStep(2)
    }
  }

  // ─── Ladezustand ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0F14' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#7C6FFF' }} />
      </div>
    )
  }

  // ─── Schritt 2 Platzhalter (kommt morgen) ───────────────────────────────────

  if (currentStep === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0F0F14' }}>
        <div className="w-full max-w-md">
          <ProgressBar current={2} total={TOTAL_STEPS} />
          <div
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#7C6FFF' }}
            >
              <BookOpen size={28} color="#ffffff" />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#E8E8F0' }}>
              Schritt 2 kommt bald!
            </h2>
            <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
              Dein Profil wurde gespeichert. Der nächste Schritt wird morgen implementiert.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#7C6FFF' }}
            >
              Zum Dashboard →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Schritt 1 ──────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#0F0F14' }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
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

        {/* Fortschrittsbalken */}
        <ProgressBar current={currentStep} total={TOTAL_STEPS} />

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
        >
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#E8E8F0' }}>
            Erzähl uns von dir 👋
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
            Diese Angaben helfen uns, StudyFlow für dich anzupassen.
          </p>

          <div className="space-y-5">
            {/* Vorname */}
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

            {/* Hochschule */}
            <Field label="Hochschule (optional)">
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

            {/* Studiengang */}
            <Field label="Studiengang (optional)">
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

            {/* Semester */}
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

          {/* Weiter-Button */}
          <button
            onClick={handleNext}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-8 transition-opacity"
            style={{
              backgroundColor: '#7C6FFF',
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Wird gespeichert…
              </span>
            ) : (
              'Weiter →'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
