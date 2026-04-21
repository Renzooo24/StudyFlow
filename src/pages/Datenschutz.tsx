import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3" style={{ color: '#E8E8F0' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-3" style={{ color: '#9090A8' }}>
        {children}
      </div>
    </div>
  )
}

function Placeholder({ text }: { text: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: '#2D1B1B', color: '#F87171', border: '1px solid #5C2D2D' }}
    >
      {text}
    </span>
  )
}


export default function Datenschutz() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: '#0F0F14' }}>
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm mb-8 transition-opacity hover:opacity-70"
          style={{ color: '#6060A0' }}
        >
          <ArrowLeft size={16} />
          Zurück
        </button>

        <h1 className="text-2xl font-bold mb-2" style={{ color: '#E8E8F0' }}>Datenschutzerklärung</h1>
        <p className="text-sm mb-8" style={{ color: '#6060A0' }}>Stand: April 2026</p>

        <div
          className="rounded-2xl p-4 mb-8 text-sm"
          style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}
        >
          ⚠️ Vor dem Launch alle Platzhalter mit deinen echten Angaben ersetzen.
        </div>

        <Section title="1. Allgemeine Hinweise">
          <p>
            Der Schutz deiner persönlichen Daten ist uns wichtig. Diese Datenschutzerklärung
            informiert dich darüber, wie wir mit deinen personenbezogenen Daten umgehen, wenn
            du StudyFlow nutzt.
          </p>
          <p>
            Verantwortlicher im Sinne der DSGVO:<br />
            <Placeholder text="[VORNAME NACHNAME]" /><br />
            <Placeholder text="[STRAẞE HAUSNUMMER, PLZ ORT]" /><br />
            E-Mail: <Placeholder text="[DEINE@EMAIL.DE]" />
          </p>
        </Section>

        <Section title="2. Welche Daten wir erfassen">
          <p>Bei der Registrierung und Nutzung von StudyFlow verarbeiten wir folgende Daten:</p>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #2A2A3A' }}
          >
            {[
              { label: 'E-Mail-Adresse', value: 'Für Login und Kommunikation' },
              { label: 'Name', value: 'Zur Personalisierung' },
              { label: 'Hochschule / Studiengang / Semester', value: 'Zur Anpassung der App' },
              { label: 'Prüfungen & Karteikarten', value: 'Kerndaten der App' },
              { label: 'Lernfortschritt', value: 'Intervalle, Bewertungen (SM-2)' },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className="flex gap-3 px-4 py-3 text-xs"
                style={{
                  backgroundColor: i % 2 === 0 ? '#0F0F14' : '#12121A',
                  borderBottom: i < arr.length - 1 ? '1px solid #1A1A24' : 'none',
                }}
              >
                <span className="font-medium w-52 shrink-0" style={{ color: '#B0B0C8' }}>{label}</span>
                <span style={{ color: '#9090A8' }}>{value}</span>
              </div>
            ))}
          </div>
          <p>
            Wir speichern keine Daten, die über den Betrieb der App hinausgehen.
            Es findet kein Tracking oder Profiling zu Werbezwecken statt.
          </p>
        </Section>

        <Section title="3. Hosting — Vercel">
          <p>
            Die App wird über <strong style={{ color: '#B0B0C8' }}>Vercel Inc.</strong> (340 Pine Street,
            San Francisco, CA 94104, USA) gehostet. Vercel kann dabei technische Zugriffsdaten
            (IP-Adresse, Browser, Zeitstempel) in Server-Logs speichern. Die Verarbeitung erfolgt
            auf Basis von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb).
          </p>
          <p>
            Vercel verfügt über ein Data Processing Agreement (DPA) und ist nach dem EU-U.S. Data
            Privacy Framework zertifiziert. Weitere Informationen:{' '}
            <span style={{ color: '#7C6FFF' }}>vercel.com/legal/privacy-policy</span>
          </p>
        </Section>

        <Section title="4. Datenbank — Supabase">
          <p>
            Alle Nutzerdaten (Profil, Prüfungen, Karteikarten, Lernfortschritt) werden in einer
            <strong style={{ color: '#B0B0C8' }}> Supabase</strong>-Datenbank gespeichert.
            Wir nutzen die Region <strong style={{ color: '#B0B0C8' }}>Frankfurt (eu-central-1)</strong>,
            sodass die Daten innerhalb der EU verbleiben.
          </p>
          <p>
            Supabase Inc. ist Auftragsverarbeiter gemäß Art. 28 DSGVO. Ein DPA ist abgeschlossen.
            Weitere Informationen:{' '}
            <span style={{ color: '#7C6FFF' }}>supabase.com/privacy</span>
          </p>
        </Section>

        <Section title="5. E-Mail-Versand — Supabase Auth">
          <p>
            Für den Versand von Bestätigungs- und Passwort-Reset-E-Mails nutzen wir den
            integrierten E-Mail-Dienst von Supabase. Dabei wird deine E-Mail-Adresse an
            Supabase übermittelt. Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b
            DSGVO (Vertragserfüllung).
          </p>
        </Section>

        <Section title="6. Zahlungen — Stripe (geplant)">
          <p>
            Für Premium-Abonnements ist die Einbindung von{' '}
            <strong style={{ color: '#B0B0C8' }}>Stripe</strong> (Stripe Payments Europe, Ltd.,
            1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland) geplant.
            Bei Zahlungsvorgängen werden Zahlungsdaten direkt an Stripe übermittelt und dort
            verarbeitet. Wir selbst speichern keine vollständigen Zahlungsdaten.
          </p>
          <p>
            Diese Funktion ist noch nicht aktiv. Sobald sie eingeführt wird, wird diese
            Datenschutzerklärung entsprechend aktualisiert.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            StudyFlow verwendet ausschließlich technisch notwendige Cookies und
            Local-Storage-Einträge, um deine Session (Login-Status) aufrechtzuerhalten.
            Es werden keine Tracking-Cookies, Analyse-Cookies oder Marketing-Cookies gesetzt.
          </p>
          <p>
            Eine Einwilligung ist für technisch notwendige Cookies nicht erforderlich
            (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
        </Section>

        <Section title="8. Speicherdauer">
          <p>
            Deine Daten werden gespeichert, solange du ein aktives Konto bei StudyFlow hast.
            Nach Löschung deines Kontos werden alle personenbezogenen Daten binnen
            30 Tagen unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten
            entgegenstehen.
          </p>
        </Section>

        <Section title="9. Deine Rechte">
          <p>Du hast nach der DSGVO folgende Rechte:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong style={{ color: '#B0B0C8' }}>Auskunft</strong> (Art. 15 DSGVO) — welche Daten wir über dich speichern</li>
            <li><strong style={{ color: '#B0B0C8' }}>Berichtigung</strong> (Art. 16 DSGVO) — Korrektur unrichtiger Daten</li>
            <li><strong style={{ color: '#B0B0C8' }}>Löschung</strong> (Art. 17 DSGVO) — Löschung deiner Daten</li>
            <li><strong style={{ color: '#B0B0C8' }}>Einschränkung</strong> (Art. 18 DSGVO) — Einschränkung der Verarbeitung</li>
            <li><strong style={{ color: '#B0B0C8' }}>Datenübertragbarkeit</strong> (Art. 20 DSGVO) — Export deiner Daten</li>
            <li><strong style={{ color: '#B0B0C8' }}>Widerspruch</strong> (Art. 21 DSGVO) — Widerspruch gegen die Verarbeitung</li>
          </ul>
          <p>
            Du kannst dein Konto und alle zugehörigen Daten jederzeit selbst in den
            Einstellungen der App löschen.
          </p>
          <p>
            Außerdem hast du das Recht, dich bei einer Aufsichtsbehörde zu beschweren, z. B.
            beim Landesbeauftragten für Datenschutz in deinem Bundesland.
          </p>
        </Section>

        <Section title="10. Kontakt für Datenschutz">
          <p>
            Bei Fragen zum Datenschutz wende dich an:<br />
            E-Mail: <Placeholder text="[DEINE@EMAIL.DE]" />
          </p>
        </Section>
      </div>
    </div>
  )
}
