export function addMonthsClamped(date: Date, months: number): Date {
  const next = new Date(date.getTime())
  const dayOfMonth = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(dayOfMonth, lastDay))
  return next
}

export function computeNext(occurrence: Date, recurrence: string): Date | null {
  const next = new Date(occurrence.getTime())
  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      return next
    case 'weekly':
      next.setDate(next.getDate() + 7)
      return next
    case 'monthly':
      return addMonthsClamped(occurrence, 1)
    case 'yearly':
      return addMonthsClamped(occurrence, 12)
    default:
      return null
  }
}

export function advanceToFuture(
  nextAt: Date,
  recurrence: string,
  now: Date,
): Date | null {
  if (recurrence === 'none') return null
  let next = new Date(nextAt.getTime())
  while (next <= now) {
    const candidate = computeNext(next, recurrence)
    if (!candidate) return null
    next = candidate
  }
  return next
}