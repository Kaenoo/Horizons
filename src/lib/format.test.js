import { describe, expect, it } from 'vitest'
import {
  daysUntil,
  formatDate,
  formatRelativeDays,
  greeting,
  isoToDateValue,
  todayISO,
  uid,
} from './format'

function dateInDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

describe('uid', () => {
  it('génère des identifiants uniques', () => {
    const set = new Set(Array.from({ length: 1000 }, () => uid()))
    expect(set.size).toBe(1000)
  })
})

describe('daysUntil', () => {
  it('retourne 0 aujourd’hui', () => {
    expect(daysUntil(dateInDays(0))).toBe(0)
  })

  it('calcule les jours futurs et passés', () => {
    expect(daysUntil(dateInDays(5))).toBe(5)
    expect(daysUntil(dateInDays(-3))).toBe(-3)
  })

  it('retourne null sans date ou invalide', () => {
    expect(daysUntil(null)).toBeNull()
    expect(daysUntil('pas une date')).toBeNull()
  })
})

describe('formatRelativeDays', () => {
  it('gère aujourd’hui, demain et hier', () => {
    expect(formatRelativeDays(dateInDays(0))).toBe("Aujourd'hui")
    expect(formatRelativeDays(dateInDays(1))).toBe('Demain')
    expect(formatRelativeDays(dateInDays(-1))).toBe('Hier')
  })

  it('nomme le jour de la semaine à moins de 7 jours', () => {
    expect(formatRelativeDays(dateInDays(3))).toMatch(/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/)
  })

  it('retourne « Dans/Il y a X j. » au-delà', () => {
    expect(formatRelativeDays(dateInDays(12))).toBe('Dans 12 j.')
    expect(formatRelativeDays(dateInDays(-20))).toBe('Il y a 20 j.')
  })

  it('retourne une chaîne vide sans date', () => {
    expect(formatRelativeDays(null)).toBe('')
  })
})

describe('formatDate', () => {
  it('formate une date ISO en français', () => {
    expect(formatDate('2025-03-15T00:00:00.000Z')).toMatch(/15 mars/)
  })

  it('retourne une chaîne vide si invalide', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('nope')).toBe('')
  })
})

describe('isoToDateValue & todayISO', () => {
  it('tronque une date ISO à AAA-MM-JJ', () => {
    expect(isoToDateValue('2025-06-01T10:00:00.000Z')).toBe('2025-06-01')
    expect(isoToDateValue(null)).toBe('')
  })

  it('todayISO retourne le jour courant au format AAA-MM-JJ', () => {
    const v = todayISO()
    expect(v).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const expected = new Date()
    const tz = expected.getTimezoneOffset() * 60000
    expect(v).toBe(new Date(expected - tz).toISOString().slice(0, 10))
  })
})

describe('greeting', () => {
  it('retourne l’un des saluts possibles', () => {
    expect(['Bonne nuit', 'Bonjour', 'Bon après-midi', 'Bonsoir']).toContain(greeting())
  })
})