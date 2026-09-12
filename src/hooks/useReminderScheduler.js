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
      const pushActive = isPushActive()
      for (const g of dueReminders(state.goals)) {
        const key = `${g.id}:${g.reminder.nextAt}`
        if (firedKeys.has(key)) continue
        firedKeys.add(key)
        if (firedKeys.size > 500) firedKeys.clear()

        if (!pushActive) {
          showSystemNotification('Rappel Horizons', g.title)
        }
        state.setLastFired({ goalId: g.id, at: new Date().toISOString() })
        state.advanceReminder(g.id)
      }
    }

    tick()
    const timer = setInterval(tick, TICK_MS)
    return () => clearInterval(timer)
  }, [])
}