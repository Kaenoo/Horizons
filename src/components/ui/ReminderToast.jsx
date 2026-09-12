import { useEffect } from 'react'
import { useGoals } from '../../store/goalsStore'
import Icon from './Icon'

export default function ReminderToast({ onOpenForm }) {
  const lastFired = useGoals((s) => s.lastFired)
  const goals = useGoals((s) => s.goals)
  const clearLastFired = useGoals((s) => s.clearLastFired)

  const goal = lastFired ? goals.find((g) => g.id === lastFired.goalId) : null

  useEffect(() => {
    if (!lastFired) return
    const t = setTimeout(() => clearLastFired(), 6000)
    return () => clearTimeout(t)
  }, [lastFired, clearLastFired])

  if (!lastFired || !goal) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 safe-top-inset">
      <div className="anim-sheet-down pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-xl backdrop-blur">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon name="bell" className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-subtle">Rappel</p>
          <p className="truncate text-[14.5px] font-semibold">{goal.title}</p>
        </div>
        {onOpenForm && (
          <button
            onClick={() => {
              clearLastFired()
              onOpenForm(goal)
            }}
            className="shrink-0 rounded-xl bg-accent px-3.5 py-2 text-[13px] font-medium text-on-accent active:scale-95"
          >
            Modifier
          </button>
        )}
        <button
          onClick={clearLastFired}
          aria-label="Fermer le rappel"
          className="flex size-8 shrink-0 items-center justify-center rounded-xl text-faint hover:bg-elevated hover:text-subtle"
        >
          <Icon name="x" className="size-4" />
        </button>
      </div>
    </div>
  )
}