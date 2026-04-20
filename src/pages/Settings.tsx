import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Mail, GraduationCap, BookOpen, Hash, Zap, Target,
  Bell, Info, FileText, Shield, LogOut, Trash2, Loader2,
  AlertCircle, Check, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#16161F', border: '1px solid #2A2A3A' }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest px-4 mb-2" style={{ color: '#6060A0' }}>
      {label}
    </p>
  )
}

function Divider() {
  return <div className="mx-4" style={{ height: '1px', backgroundColor: '#1A1A24' }} />
}

function RowLabel({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <Icon size={15} style={{ color: '#6060A0' }} />
      <span className="text-sm" style={{ color: '#9090A8' }}>{label}</span>
    </div>
  )
}

// ─── EditableRow ──────────────────────────────────────────────────────────────

function EditableRow({
  icon, label, value, onChange, placeholder, type = 'text',
}: {
  icon: typeof User
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <RowLabel icon={icon} label={label} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 text-sm text-right outline-none bg-transparent min-w-0"
        style={{ color: focused ? '#E8E8F0' : '#B0B0C8', caretColor: '#7C6FFF' }}
      />
    </div>
  )
}

function StaticRow({
  icon, label, value, badge,
}: {
  icon: typeof User
  label: string
  value: string
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <RowLabel icon={icon} label={label} />
      <div className="flex-1 flex items-center justify-end gap-2">
        {badge}
        <span className="text-sm" style={{ color: '#9090A8' }}>{value}</span>
      </div>
    </div>
  )
}

function LinkRow({ icon, label, onClick }: { icon: typeof User; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-opacity hover:opacity-70 text-left"
    >
      <RowLabel icon={icon} label={label} />
      <ChevronRight size={15} className="ml-auto" style={{ color: '#3A3A4A' }} />
    </button>
  )
}

// ─── DeleteDialog ─────────────────────────────────────────────────────────────

function DeleteDialog({ onCancel, onConfirm, deleting }: {
  onCancel: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl p-7 text-center"
        style={{ backgroundColor: '#16161F', border: '1px solid #3D1A1A' }}
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: '#2D1B1B' }}
        >
          <Trash2 size={24} style={{ color: '#F87171' }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#E8E8F0' }}>Konto löschen?</h2>
        <p className="text-sm mb-6" style={{ color: '#9090A8' }}>
          Alle Prüfungen, Karteikarten und Lernfortschritte werden unwiderruflich gelöscht.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#1A1A24', color: '#9090A8', border: '1px solid #2A2A3A' }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity"
            style={{ backgroundColor: '#5C2D2D', color: '#F87171' }}
          >
            {deleting
              ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" />…</span>
              : 'Ja, löschen'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  // Profil-Felder
  const [name, setName]           = useState('')
  const [university, setUniversity] = useState('')
  const [subject, setSubject]     = useState('')   // DB-Spalte: study_program
  const [semester, setSemester]   = useState('')
  const [plan, setPlan]           = useState('free')
  const [dailyGoal, setDailyGoal] = useState('20')

  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting]   = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_profiles')
      .select('name, university, study_program, semester, plan, daily_goal')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name ?? '')
          setUniversity(data.university ?? '')
          setSubject(data.study_program ?? '')
          setSemester(data.semester != null ? String(data.semester) : '')
          setPlan(data.plan ?? 'free')
          setDailyGoal(String(data.daily_goal ?? 20))
        }
        setLoading(false)
      })
  }, [user])

  const handleSave = async () => {
    if (!user || saving) return
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase
      .from('user_profiles')
      .update({
        name: name.trim(),
        university: university.trim(),
        study_program: subject.trim(),
        semester: semester.trim(),
        daily_goal: parseInt(dailyGoal) || 20,
      })
      .eq('id', user.id)
    if (error) {
      setSaveError('Fehler beim Speichern.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    }
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    // CASCADE löscht exams → flashcards automatisch
    await supabase.from('user_profiles').delete().eq('id', user.id)
    await supabase.auth.admin?.deleteUser(user.id).catch(() => null)
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto space-y-6" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: '#1A1A24' }} />
        ))}
      </div>
    )
  }

  const avatarLetters = initials(name || user?.email || '?')

  return (
    <>
      <div className="px-4 py-8 max-w-lg mx-auto space-y-6" style={{ backgroundColor: '#0F0F14', minHeight: '100vh' }}>

        {/* ── Profil ── */}
        <div>
          <SectionTitle label="Profil" />
          <SectionCard>
            {/* Avatar */}
            <div className="flex flex-col items-center py-6 px-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                style={{ backgroundColor: '#7C6FFF' }}
              >
                {avatarLetters}
              </div>
              <p className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>{name || '–'}</p>
            </div>
            <Divider />
            <EditableRow icon={User}          label="Name"        value={name}        onChange={setName}        placeholder="Dein Name" />
            <Divider />
            <EditableRow icon={GraduationCap} label="Hochschule"  value={university}  onChange={setUniversity}  placeholder="z.B. TU München" />
            <Divider />
            <EditableRow icon={BookOpen}      label="Studiengang" value={subject}      onChange={setSubject}     placeholder="z.B. Informatik" />
            <Divider />
            <EditableRow icon={Hash}          label="Semester"    value={semester}     onChange={setSemester}    placeholder="z.B. 3" />
            <Divider />

            {saveError && (
              <div className="flex items-center gap-2 mx-4 mt-3 rounded-xl p-3 text-xs"
                style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}>
                <AlertCircle size={13} className="shrink-0" />{saveError}
              </div>
            )}

            <div className="px-4 py-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: saved ? '#1A5C35' : '#7C6FFF',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? <><Loader2 size={15} className="animate-spin" />Speichern…</>
                  : saved
                    ? <><Check size={15} />Gespeichert</>
                    : 'Speichern'}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* ── Konto ── */}
        <div>
          <SectionTitle label="Konto" />
          <SectionCard>
            <StaticRow
              icon={Mail}
              label="E-Mail"
              value={user?.email ?? '–'}
            />
            <Divider />
            <StaticRow
              icon={Zap}
              label="Plan"
              value=""
              badge={
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={
                    plan === 'premium'
                      ? { backgroundColor: '#1E1B2E', color: '#A78BFA', border: '1px solid #4C3D8C' }
                      : { backgroundColor: '#1A1A24', color: '#6060A0', border: '1px solid #2A2A3A' }
                  }
                >
                  {plan === 'premium' ? 'Premium' : 'Free'}
                </span>
              }
            />
            {plan !== 'premium' && (
              <>
                <Divider />
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full flex items-center justify-between px-4 py-3.5 transition-opacity hover:opacity-70"
                >
                  <div className="flex items-center gap-2.5">
                    <Zap size={15} style={{ color: '#7C6FFF' }} />
                    <span className="text-sm font-semibold" style={{ color: '#7C6FFF' }}>Upgrade auf Premium</span>
                  </div>
                  <ChevronRight size={15} style={{ color: '#7C6FFF' }} />
                </button>
              </>
            )}
          </SectionCard>
        </div>

        {/* ── Lernpräferenzen ── */}
        <div>
          <SectionTitle label="Lernpräferenzen" />
          <SectionCard>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <RowLabel icon={Target} label="Tägliches Ziel" />
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                  min={1}
                  max={500}
                  className="w-16 text-sm text-right outline-none bg-transparent"
                  style={{ color: '#B0B0C8', caretColor: '#7C6FFF' }}
                />
                <span className="text-sm" style={{ color: '#6060A0' }}>Karten/Tag</span>
              </div>
            </div>
            <Divider />
            <div className="flex items-center gap-3 px-4 py-3.5">
              <RowLabel icon={Bell} label="Erinnerungen" />
              <span className="ml-auto text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#1A1A24', color: '#6060A0' }}>
                Kommt bald
              </span>
            </div>
          </SectionCard>
        </div>

        {/* ── Über ── */}
        <div>
          <SectionTitle label="Über" />
          <SectionCard>
            <StaticRow icon={Info} label="Version" value="0.1.0" />
            <Divider />
            <LinkRow icon={FileText} label="Impressum"   onClick={() => navigate('/impressum')} />
            <Divider />
            <LinkRow icon={Shield}   label="Datenschutz" onClick={() => navigate('/datenschutz')} />
          </SectionCard>
        </div>

        {/* ── Gefahrenzone ── */}
        <div>
          <SectionTitle label="Gefahrenzone" />
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#16161F', border: '1px solid #3D1A1A' }}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-4 transition-opacity hover:opacity-70 text-left"
            >
              <LogOut size={15} style={{ color: '#F87171' }} />
              <span className="text-sm font-semibold" style={{ color: '#F87171' }}>Abmelden</span>
            </button>
            <div className="mx-4" style={{ height: '1px', backgroundColor: '#3D1A1A' }} />
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-3 px-4 py-4 transition-opacity hover:opacity-70 text-left"
            >
              <Trash2 size={15} style={{ color: '#F87171' }} />
              <span className="text-sm font-semibold" style={{ color: '#F87171' }}>Konto löschen</span>
            </button>
          </div>
        </div>

      </div>

      {showDeleteDialog && (
        <DeleteDialog
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteAccount}
          deleting={deleting}
        />
      )}
    </>
  )
}
