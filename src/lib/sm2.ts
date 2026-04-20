/**
 * Bewertungsskala für eine Lernkarte.
 * 0 = Nochmal (komplett vergessen)
 * 1 = Schwer   (mit Mühe gewusst)
 * 2 = Gut      (gewusst)
 * 3 = Perfekt  (sofort gewusst)
 */
export type Rating = 0 | 1 | 2 | 3

/** Eingabe-Zustand einer Karteikarte */
export interface CardState {
  interval: number
  easiness_factor: number
  repetitions: number
}

/** Ergebnis der SM-2-Berechnung */
export interface ReviewResult {
  newInterval: number
  newEasinessFactor: number
  newRepetitions: number
  nextReviewDate: Date
}

const EF_MIN = 1.3
const EF_MAX = 2.5

/**
 * Begrenzt den Easiness-Factor auf den zulässigen Bereich [1.3, 2.5].
 */
function clampEF(ef: number): number {
  return Math.min(EF_MAX, Math.max(EF_MIN, ef))
}

/**
 * Berechnet die neue Intervall-Länge anhand der Bewertung.
 * Bei rating 2 und 3 richtet sich das Intervall nach der Anzahl der Wiederholungen.
 */
function calcInterval(rating: Rating, interval: number, repetitions: number, ef: number): number {
  if (rating === 0) return 1
  if (rating === 1) return Math.max(1, Math.round(interval * 1.2))
  // rating 2 oder 3: gleiche Intervall-Logik
  if (repetitions === 1) return 1
  if (repetitions === 2) return 6
  return Math.round(interval * ef)
}

/**
 * Passt den Easiness-Factor nach der klassischen SM-2-Formel an.
 * Für rating 3 wird zusätzlich +0.15 addiert (Bonus für perfekte Antwort).
 * Der Wert wird auf [1.3, 2.5] begrenzt.
 */
function calcEF(rating: Rating, ef: number): number {
  // Klassische SM-2-Formel (angepasst auf 0–3-Skala):
  // delta = 0.1 − (3 − q) × (0.08 + (3 − q) × 0.02)
  const delta = 0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02)
  const adjusted = rating === 3 ? ef + delta + 0.15 : ef + delta
  return clampEF(adjusted)
}

/**
 * Berechnet den nächsten Wiederholungstermin einer Karteikarte
 * nach dem SM-2-Algorithmus (SuperMemo 2).
 *
 * @param card    - Aktueller Zustand der Karte (Intervall, Easiness-Factor, Wiederholungen)
 * @param rating  - Bewertung der Antwort: 0 (vergessen) bis 3 (perfekt)
 * @returns       - Neue Kartenwerte und das Datum der nächsten Wiederholung
 */
export function calculateNextReview(card: CardState, rating: Rating): ReviewResult {
  let newRepetitions: number
  let newInterval: number
  let newEasinessFactor: number

  if (rating === 0) {
    newRepetitions = 0
    newInterval = 1
    newEasinessFactor = calcEF(rating, card.easiness_factor)
  } else {
    newRepetitions = card.repetitions + 1
    newInterval = calcInterval(rating, card.interval, newRepetitions, card.easiness_factor)
    newEasinessFactor = calcEF(rating, card.easiness_factor)
  }

  const nextReviewDate = new Date()
  nextReviewDate.setHours(0, 0, 0, 0)
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return { newInterval, newEasinessFactor, newRepetitions, nextReviewDate }
}
