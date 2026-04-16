# StudyFlow

StudyFlow ist eine moderne Web-App zur Unterstützung beim Lernen und Verwalten von Studieninhalten.

## Technologie-Stack

| Technologie | Beschreibung |
|---|---|
| [React 18](https://react.dev/) | UI-Framework |
| [TypeScript](https://www.typescriptlang.org/) | Typsicherheit |
| [Vite](https://vite.dev/) | Build-Tool & Dev-Server |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-First CSS |
| [React Router v6](https://reactrouter.com/) | Client-seitiges Routing |
| [Zustand](https://zustand-demo.pmnd.rs/) | State Management |
| [Supabase](https://supabase.com/) | Backend as a Service |
| [Lucide React](https://lucide.dev/) | Icon-Bibliothek |
| [Framer Motion](https://www.framer.com/motion/) | Animationen |

## Projekt starten

### Voraussetzungen

- Node.js >= 18
- npm oder pnpm

### Installation

```bash
# Abhängigkeiten installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env
# .env mit deinen Supabase-Zugangsdaten befüllen

# Entwicklungsserver starten
npm run dev
```

Die App ist dann unter `http://localhost:5173` erreichbar.

### Weitere Befehle

```bash
npm run build    # Produktions-Build erstellen
npm run preview  # Produktions-Build lokal testen
npm run lint     # Code-Qualität prüfen
```

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `VITE_SUPABASE_URL` | URL deines Supabase-Projekts |
| `VITE_SUPABASE_ANON_KEY` | Anonymer Public-Key von Supabase |

Diese Werte findest du im Supabase Dashboard unter **Project Settings → API**.

## Projektstruktur

```
src/
├── lib/
│   └── supabase.ts   # Supabase Client
├── types/
│   └── index.ts      # TypeScript-Typen & Interfaces
├── App.tsx           # Haupt-App-Komponente
├── main.tsx          # Einstiegspunkt
└── index.css         # Globale Stile (Tailwind)
```
