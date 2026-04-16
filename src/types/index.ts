// Globale TypeScript-Typen und Interfaces für StudyFlow
// Hier werden später alle gemeinsamen Typen definiert.

// Beispiel: Benutzer-Profil
export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  createdAt: string
}

// Beispiel: Lernkarte / Flashcard
export interface Flashcard {
  id: string
  userId: string
  front: string
  back: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Beispiel: Lerneinheit / Deck
export interface Deck {
  id: string
  userId: string
  title: string
  description?: string
  cardCount: number
  createdAt: string
  updatedAt: string
}
