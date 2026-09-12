import { useEffect, useRef } from 'react'
import { useGoals } from '../store/goalsStore'
import { isPushActive, remindersToJobs, syncReminderJobs } from '../lib/push'

export function usePushReminders() {
  const timerRef = useRef(null)

  useEffect(() => {
    const sync = () => {
      if (!isPushActive()) return
      const goals = useGoals.getState().goals
      syncReminderJobs(remindersToJobs(goals))
    }

    const unsubscribe = useGoals.subscribe((_state) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(sync, 750)
    })

    sync()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      unsubscribe()
    }
  }, [])
}