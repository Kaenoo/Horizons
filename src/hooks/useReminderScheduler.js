import { useEffect } from 'react'
import { dueReminders, useGoals } from '../store/goalsStore'
import { showSystemNotification } from '../lib/notify'
import { isPushActive } from '../lib/push'

const TICK_MS = 15000
const firedKeys = new Set()

export function useReminderScheduler() {
  useEffect(() => {
    const tick = () => {
      const state = useGoals.getState()
      if (isPushActive()) return
      for (const g of dueReminders(state.goals)) {
        const key = `${g.id}:${g.reminder.nextAt}`
        if (firedKeys.has(key)) continue
        firedKeys.add(key)
        if (firedKeys.size > 500) firedKeys.clear()

        showSystemNotification(g.title)
        state.advanceReminder(g.id)
      }
    }

    tick()
    const timer = setInterval(tick, TICK_MS)
    return () => clearInterval(timer)
  }, [])
}