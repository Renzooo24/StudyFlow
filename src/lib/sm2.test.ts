/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest'
import { calculateNextReview } from './sm2'

describe('SM-2 Algorithmus', () => {
  /**
   * Eine neue Karte (repetitions=0) wird mit "Perfekt" bewertet.
   * Erwartet: erste Wiederholung gesetzt, Intervall 1 Tag, EF bei Maximum gehalten.
   */
  test('Neue Karte mit rating 3 (Perfekt)', () => {
    const result = calculateNextReview(
      { interval: 1, easiness_factor: 2.5, repetitions: 0 },
      3,
    )
    expect(result.newRepetitions).toBe(1)
    expect(result.newInterval).toBe(1)
    // EF würde 2.5 + 0.25 = 2.75 → wird auf Maximum 2.5 begrenzt
    expect(result.newEasinessFactor).toBe(2.5)
    expect(result.nextReviewDate).toBeInstanceOf(Date)
  })

  /**
   * Eine Karte mit mehreren Wiederholungen wird mit "Nochmal" (0) bewertet.
   * Erwartet: vollständiger Reset – repetitions=0, Intervall=1, EF sinkt.
   */
  test('Karte mit rating 0 (Reset / komplett vergessen)', () => {
    const result = calculateNextReview(
      { interval: 15, easiness_factor: 2.2, repetitions: 5 },
      0,
    )
    expect(result.newRepetitions).toBe(0)
    expect(result.newInterval).toBe(1)
    // delta = 0.1 - 3*(0.08 + 3*0.02) = -0.32 → 2.2 - 0.32 = 1.88
    expect(result.newEasinessFactor).toBeCloseTo(1.88, 5)
  })

  /**
   * Eine fortgeschrittene Karte (5 Wiederholungen, Intervall 20 Tage)
   * wird mit "Gut" (2) bewertet.
   * Erwartet: Intervall = round(20 × 2.1) = 42, EF bleibt unverändert.
   */
  test('Karte nach 5 Wiederholungen mit rating 2 (Gut)', () => {
    const result = calculateNextReview(
      { interval: 20, easiness_factor: 2.1, repetitions: 5 },
      2,
    )
    expect(result.newRepetitions).toBe(6)
    expect(result.newInterval).toBe(42) // round(20 * 2.1)
    // delta bei rating 2 = 0, EF bleibt 2.1
    expect(result.newEasinessFactor).toBeCloseTo(2.1, 5)
  })

  /**
   * Der Easiness-Factor darf das Minimum von 1.3 nie unterschreiten,
   * auch wenn mehrfach mit "Nochmal" bewertet wird.
   */
  test('Easiness Factor Minimum (1.3)', () => {
    const result = calculateNextReview(
      { interval: 1, easiness_factor: 1.3, repetitions: 0 },
      0,
    )
    // Ohne Begrenzung: 1.3 - 0.32 = 0.98 → muss auf 1.3 begrenzt werden
    expect(result.newEasinessFactor).toBe(1.3)
  })

  /**
   * Der Easiness-Factor darf das Maximum von 2.5 nie überschreiten,
   * auch wenn mehrfach mit "Perfekt" bewertet wird.
   */
  test('Easiness Factor Maximum (2.5)', () => {
    const result = calculateNextReview(
      { interval: 1, easiness_factor: 2.5, repetitions: 3 },
      3,
    )
    // Ohne Begrenzung: 2.5 + 0.1 + 0.15 = 2.75 → muss auf 2.5 begrenzt werden
    expect(result.newEasinessFactor).toBe(2.5)
  })
})
