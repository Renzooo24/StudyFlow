import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3" style={{ color: '#E8E8F0' }}>{title}</h2>
      <div className="text-sm leading-relaxed space-y-1" style={{ color: '#9090A8' }}>
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

export default function Impressum() {
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

        <h1 className="text-2xl font-bold mb-8" style={{ color: '#E8E8F0' }}>Impressum</h1>

        <div
          className="rounded-2xl p-4 mb-8 text-sm"
          style={{ backgroundColor: '#2D1B1B', border: '1px solid #5C2D2D', color: '#F87171' }}
        >
          ⚠️ Vor dem Launch alle Platzhalter mit deinen echten Angaben ersetzen.
        </div>

        <Section title="Anbieter">
          <p><Placeholder text="[VORNAME NACHNAME]" /></p>
          <p><Placeholder text="[STRAẞE HAUSNUMMER]" /></p>
          <p><Placeholder text="[PLZ ORT]" /></p>
          <p><Placeholder text="[LAND]" /></p>
        </Section>

        <Section title="Kontakt">
          <p>E-Mail: <Placeholder text="[DEINE@EMAIL.DE]" /></p>
        </Section>

        <Section title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
          <p><Placeholder text="[VORNAME NACHNAME]" /></p>
          <p><Placeholder text="[STRAẞE HAUSNUMMER, PLZ ORT]" /></p>
        </Section>

        <Section title="Haftungsausschluss">
          <p className="mb-3">
            <strong style={{ color: '#B0B0C8' }}>Haftung für Inhalte</strong>
          </p>
          <p className="mb-4">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
            als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </p>
          <p className="mb-3">
            <strong style={{ color: '#B0B0C8' }}>Haftung für Links</strong>
          </p>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
            keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
            Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
            Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
        </Section>

        <Section title="Urheberrecht">
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
            unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche
            gekennzeichnet. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
            Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </Section>

        <p className="text-xs mt-8" style={{ color: '#4A4A6A' }}>
          Zuletzt aktualisiert: April 2026
        </p>
      </div>
    </div>
  )
}
