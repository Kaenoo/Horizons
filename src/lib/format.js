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

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function datetimeLocalToISO(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function isoToDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`
}

export function formatReminderAt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
  const diff = daysUntil(iso)
  if (diff === 0) return `Aujourd’hui à ${time}`
  if (diff === 1) return `Demain à ${time}`
  if (diff >= 2 && diff <= 6) {
    const day = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d)
    const cap = day[0].toUpperCase() + day.slice(1, 3)
    return `${cap}. à ${time}`
  }
  const date = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(d)
  return `${date} à ${time}`
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