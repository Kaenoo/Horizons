export const RECURRENCES = [
  { id: 'none', label: 'Aucune' },
  { id: 'daily', label: 'Chaque jour' },
  { id: 'weekly', label: 'Chaque semaine' },
  { id: 'monthly', label: 'Chaque mois' },
  { id: 'yearly', label: 'Chaque année' },
]

export const RECURRENCE_MAP = Object.fromEntries(
  RECURRENCES.map((r) => [r.id, r]),
)

export function recurrenceLabel(id) {
  return RECURRENCE_MAP[id]?.label ?? "Aucune"
}

export function addDays(date, days) {
  const next = new Date(date.getTime())
  next.setDate(next.getDate() + days)
  return next
}

export function addMonthsClamped(date, months) {
  const next = new Date(date.getTime())
  const dayOfMonth = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  const lastDay = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate()
  next.setDate(Math.min(dayOfMonth, lastDay))
  return next
}

export function addYearsClamped(date, years) {
  return addMonthsClamped(date, years * 12)
}

export function computeNext(occurrence, recurrence) {
  if (!occurrence || !(occurrence instanceof Date) || Number.isNaN(occurrence.getTime())) {
    return null
  }
  switch (recurrence) {
    case 'daily':
      return addDays(occurrence, 1)
    case 'weekly':
      return addDays(occurrence, 7)
    case 'monthly':
      return addMonthsClamped(occurrence, 1)
    case 'yearly':
      return addYearsClamped(occurrence, 1)
    default:
      return null
  }
}

export function advanceToFuture(nextAt, recurrence, now = new Date()) {
  if (recurrence === 'none') return null
  let next = new Date(nextAt.getTime())
  while (next <= now) {
    const candidate = computeNext(next, recurrence)
    if (!candidate) return null
    next = candidate
  }
  return next
}

export function nextOccurrenceLabel(id) {
  if (id === 'daily') return 'tous les jours'
  if (id === 'weekly') return 'toutes les semaines'
  if (id === 'monthly') return 'tous les mois'
  if (id === 'yearly') return 'tous les ans'
  return ''
}