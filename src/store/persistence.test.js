import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearState,
  createPersister,
  loadState,
  makeKey,
  safeParse,
  saveState,
  useLocalStorage,
} from './persistence'
import { act, renderHook } from '@testing-library/react'

describe('makeKey', () => {
  it('préfixe et versionne la clé', () => {
    expect(makeKey('goals')).toBe('horizons:goals:v1')
    expect(makeKey('goals', 3)).toBe('horizons:goals:v3')
    expect(makeKey('theme')).toBe('horizons:theme:v1')
  })
})

describe('safeParse', () => {
  it('retourne le fallback si null/undefined', () => {
    expect(safeParse(null, [])).toEqual([])
    expect(safeParse(undefined, { x: 1 })).toEqual({ x: 1 })
  })

  it('parse un JSON valide', () => {
    expect(safeParse('{"a":1}', null)).toEqual({ a: 1 })
  })

  it('retourne le fallback sur un JSON corrompu', () => {
    expect(safeParse('{invalid', null)).toBeNull()
    expect(safeParse('plain text', 'default')).toBe('default')
  })
})

describe('loadState / saveState / clearState', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('renvoie le fallback quand la clé est absente', () => {
    expect(loadState('missing', 'fb')).toBe('fb')
  })

  it('sauvegarde puis relit un objet', () => {
    saveState(makeKey('x'), { n: 42 })
    expect(loadState(makeKey('x'), null)).toEqual({ n: 42 })
  })

  it('retourne le fallback sur un stockage corrompu', () => {
    localStorage.setItem(makeKey('bad'), 'not json {')
    expect(loadState(makeKey('bad'), 'fb')).toBe('fb')
  })

  it('clearState supprime la clé', () => {
    saveState(makeKey('x'), {})
    clearState(makeKey('x'))
    expect(loadState(makeKey('x'), 'gone')).toBe('gone')
  })
})

describe('createPersister', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.clearAllTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('n’écrit pas avant le délai (debounce)', () => {
    const p = createPersister(makeKey('p'), { delay: 250 })
    p.schedule({ v: 1 })
    expect(loadState(makeKey('p'), null)).toBeNull()
  })

  it('écrit après le délai de silence', () => {
    const p = createPersister(makeKey('p'), { delay: 250 })
    p.schedule({ v: 1 })
    vi.advanceTimersByTime(250)
    expect(loadState(makeKey('p'), null)).toEqual({ v: 1 })
  })

  it('ne garde que la dernière valeur pendant la période de silence', () => {
    const p = createPersister(makeKey('p'), { delay: 250 })
    p.schedule({ v: 1 })
    p.schedule({ v: 2 })
    p.schedule({ v: 3 })
    vi.advanceTimersByTime(250)
    expect(loadState(makeKey('p'), null)).toEqual({ v: 3 })
    vi.advanceTimersByTime(30)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('flush écrit immédiatement', () => {
    const p = createPersister(makeKey('p'), { delay: 250 })
    p.schedule({ v: 1 })
    p.flush()
    expect(loadState(makeKey('p'), null)).toEqual({ v: 1 })
  })

  it('clear retire la clé et annule l’écriture en attente', () => {
    const p = createPersister(makeKey('p'), { delay: 250 })
    p.schedule({ v: 1 })
    p.clear()
    vi.advanceTimersByTime(250)
    expect(loadState(makeKey('p'), 'gone')).toBe('gone')
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear())

  it('lit la valeur persistée au montage', () => {
    saveState(makeKey('t'), { mode: 'dark' })
    const { result } = renderHook(() => useLocalStorage(makeKey('t'), { mode: 'light' }))
    expect(result.current[0]).toEqual({ mode: 'dark' })
  })

  it('met à jour l’état et le localStorage', () => {
    const { result } = renderHook(() => useLocalStorage(makeKey('t'), 0))
    act(() => result.current[1](1))
    expect(result.current[0]).toBe(1)
    expect(loadState(makeKey('t'), null)).toBe(1)
  })

  it('accepte un setter fonctionnel', () => {
    const { result } = renderHook(() => useLocalStorage(makeKey('t'), 0))
    act(() => result.current[1]((n) => n + 2))
    expect(result.current[0]).toBe(2)
  })
})