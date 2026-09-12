import { useCallback, useEffect, useState } from 'react'
import { loadState, saveState, makeKey } from '../store/persistence'

export const THEME_KEY = makeKey('theme')
export const THEME_NONE = 'system'

export const THEME_OPTIONS = [
  { id: 'system', label: 'Système', icon: 'monitor' },
  { id: 'light', label: 'Clair', icon: 'sun' },
  { id: 'dark', label: 'Sombre', icon: 'moon' },
]

const LIGHT_COLOR = '#f2f2f4'
const DARK_COLOR = '#0f1115'

function media() {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null
}

export function resolveDark(pref) {
  if (pref === 'dark') return true
  if (pref === 'light') return false
  const m = media()
  return m ? m.matches : false
}

function applyToDom(pref) {
  if (typeof document === 'undefined') return
  const dark = resolveDark(pref)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? DARK_COLOR : LIGHT_COLOR)
}

export function applyTheme(pref) {
  applyToDom(pref)
}

export function useTheme() {
  const [pref, setPref] = useState(() => loadState(THEME_KEY, THEME_NONE))

  const setTheme = useCallback((next) => {
    setPref(next)
    saveState(THEME_KEY, next)
  }, [])

  useEffect(() => {
    applyTheme(pref)
    const onChange = () => {
      if (pref === 'system') applyTheme('system')
    }
    const m = media()
    const onStorage = (e) => {
      if (e.key !== THEME_KEY) return
      const next = e.newValue || THEME_NONE
      setPref(next)
      applyTheme(next)
    }
    m?.addEventListener('change', onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      m?.removeEventListener('change', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [pref])

  return { theme: pref, setTheme }
}