import { useCallback, useState } from 'react'

const PREFIX = 'horizons:'
const DEFAULT_VERSION = 1

export function makeKey(name, version = DEFAULT_VERSION) {
  return `${PREFIX}${name}:v${version}`
}

function storage() {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function loadState(key, fallback) {
  const s = storage()
  if (!s) return fallback
  try {
    const raw = s.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveState(key, value) {
  const s = storage()
  if (!s) return false
  try {
    s.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function clearState(key) {
  const s = storage()
  if (!s) return
  try {
    s.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function safeParse(raw, fallback) {
  if (raw == null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * Petite API réutilisable (ex: préférence de thème).
 * Similaire à useLocalStorage mais encodée/décodée JSON.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => loadState(key, initialValue))

  const setStored = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        saveState(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, setStored]
}

/**
 * Persistance debouncée pour le store global.
 * Écrivains l'état sous forme de JSON, regroupées après une période de silence
 * pour ne jamais bloquer le thread principal à chaque frappe.
 */
export function createPersister(key, { delay = 250 } = {}) {
  let timer = null
  let pending = null
  let writing = false

  const writeNow = () => {
    if (pending == null) return
    const snapshot = pending
    pending = null
    writing = true
    saveState(key, snapshot)
    writing = false
  }

  return {
    schedule(value) {
      pending = value
      if (timer) clearTimeout(timer)
      timer = setTimeout(writeNow, delay)
    },
    flush() {
      if (timer) clearTimeout(timer)
      timer = null
      writeNow()
    },
    isWriting() {
      return writing
    },
    clear() {
      if (timer) clearTimeout(timer)
      timer = null
      pending = null
      clearState(key)
    },
  }
}