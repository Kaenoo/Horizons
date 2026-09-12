import { describe, expect, it } from 'vitest'
import {
  addDays,
  addYearsClamped,
  advanceToFuture,
  computeNext,
  recurrenceLabel,
} from './recurrence'

function dt(iso) {
  return new Date(iso)
}

describe('computeNext', () => {
  it('retourne null pour une récurrence none ou invalide', () => {
    expect(computeNext(dt('2026-01-31T09:00:00Z'), 'none')).toBeNull()
    expect(computeNext(null, 'daily')).toBeNull()
    expect(computeNext(dt('2026-01-31T09:00:00Z'), 'bonjour')).toBeNull()
  })

  it('quotidien ajoute un jour', () => {
    const next = computeNext(dt('2026-01-10T14:30:00Z'), 'daily')
    expect(next.toISOString()).toBe('2026-01-11T14:30:00.000Z')
  })

  it('hebdomadaire ajoute 7 jours', () => {
    const next = computeNext(dt('2026-03-02T08:00:00Z'), 'weekly')
    expect(next.toISOString()).toBe('2026-03-09T08:00:00.000Z')
  })

  it('mensuel ajoute un mois', () => {
    const next = computeNext(dt('2026-01-15T09:00:00Z'), 'monthly')
    expect(next.toISOString()).toBe('2026-02-15T09:00:00.000Z')
  })

  it('mensuel clame le 31 → 28 février', () => {
    const feb = computeNext(dt('2026-01-31T09:00:00Z'), 'monthly')
    expect(feb.toISOString()).toBe('2026-02-28T09:00:00.000Z')
  })

  it('mensuel garde le jour clampé (28) après février', () => {
    const mar = computeNext(dt('2026-02-28T09:00:00Z'), 'monthly')
    expect(mar.toISOString()).toBe('2026-03-28T09:00:00.000Z')
  })

  it('annuel gère le 29 février', () => {
    const next = computeNext(dt('2024-02-29T09:00:00Z'), 'yearly')
    expect(next.toISOString()).toBe('2025-02-28T09:00:00.000Z')
  })
})

describe('addMonthsClamped / addYearsClamped', () => {
  it('garde une heure cohérente', () => {
    expect(addYearsClamped(dt('2024-02-29T09:30:00Z'), 1).toISOString()).toBe(
      '2025-02-28T09:30:00.000Z',
    )
    expect(addDays(dt('2026-12-31T23:59:00Z'), 1).toISOString()).toBe(
      '2027-01-01T23:59:00.000Z',
    )
  })
})

describe('advanceToFuture', () => {
  it('saute les occurrences passées pour retomber à la suivante', () => {
    const now = dt('2026-09-12T18:00:00Z')
    const next = advanceToFuture(
      dt('2026-09-12T14:30:00Z'),
      'daily',
      now,
    )
    expect(next.toISOString()).toBe('2026-09-13T14:30:00.000Z')
  })

  it('retourne la même date si elle est strictement future', () => {
    const future = dt('2026-09-20T09:00:00Z')
    const next = advanceToFuture(future, 'daily', dt('2026-09-12T18:00:00Z'))
    expect(next.toISOString()).toBe(future.toISOString())
  })

  it('retourne null pour une récurrence none', () => {
    expect(advanceToFuture(dt('2026-09-12T09:00:00Z'), 'none')).toBeNull()
  })
})

describe('recurrenceLabel', () => {
  it('libelle connu ou inconnu', () => {
    expect(recurrenceLabel('weekly')).toBe('Chaque semaine')
    expect(recurrenceLabel('none')).toBe('Aucune')
    expect(recurrenceLabel('bogus')).toBe('Aucune')
  })
})