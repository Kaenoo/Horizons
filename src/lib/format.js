export function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const FR_OPTS = { day: 'numeric', month: 'long' }

export function formatDate(iso, opts = FR_OPTS) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', opts).format(d)
  } catch {
    return d.toLocaleDateString('fr-FR')
  }
}

export function formatRelativeDays(iso) {
  if (!iso) return ''
  const diff = daysUntil(iso)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  if (diff === -1) return 'Hier'
  if (diff > 1 && diff < 7) {
    return Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(new Date(iso))
  }
  if (diff > 0) return `Dans ${diff} j.`
  return `Il y a ${Math.abs(diff)} j.`
}

export function daysUntil(iso) {
  if (!iso) return null
  const now = new Date()
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  return Math.round((b - a) / 86400000)
}

export function todayISO() {
  const now = new Date()
  const tz = now.getTimezoneOffset() * 60000
  return new Date(now - tz).toISOString().slice(0, 10)
}

export function isoToDateValue(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export function subtitleForDay() {
  const opts = { weekday: 'long', day: 'numeric', month: 'long' }
  const s = formatDate(new Date().toISOString(), opts)
  return s.charAt(0).toUpperCase() + s.slice(1)
}