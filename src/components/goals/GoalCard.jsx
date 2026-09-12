import { useState } from 'react'
import {
  goalProgress,
  useGoals,
} from '../../store/goalsStore'
import { STATUSES, STATUS_MAP } from '../../lib/constants'
import { daysUntil, formatDate, formatRelativeDays } from '../../lib/format'
import Button from '../ui/Button'
import Checkbox from '../ui/Checkbox'
import Icon from '../ui/Icon'
import ProgressBar from '../ui/ProgressBar'

const CAT = {
  short: {
    dot: 'bg-court',
    chip: 'bg-court-soft text-court',
    bar: 'bg-court',
  },
  medium: {
    dot: 'bg-moyen',
    chip: 'bg-moyen-soft text-moyen',
    bar: 'bg-moyen',
  },
  long: {
    dot: 'bg-long',
    chip: 'bg-long-soft text-long',
    bar: 'bg-long',
  },
}

const STATUS_STYLE = {
  todo: 'bg-elevated text-subtle',
  in_progress: 'bg-moyen-soft text-moyen',
  done: 'bg-ok-soft text-ok',
}

function CycleStatus({ goal }) {
  const setStatus = useGoals((s) => s.setStatus)
  const next =
    STATUSES[(STATUSES.findIndex((s) => s.id === goal.status) + 1) % STATUSES.length]

  return (
    <button
      onClick={() => setStatus(goal.id, next.id)}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-all active:scale-95 ${STATUS_STYLE[goal.status]}`}
    >
      {STATUS_MAP[goal.status].label}
      <Icon name="chevron" className="size-3 -rotate-90" strokeWidth={2.4} />
    </button>
  )
}

export default function GoalCard({ goal, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const toggleSubtask = useGoals((s) => s.toggleSubtask)
  const deleteGoal = useGoals((s) => s.deleteGoal)
  const [confirming, setConfirming] = useState(false)

  const progress = goalProgress(goal)
  const pct = Math.round(progress * 100)
  const subtaskCount = goal.subtasks?.length ?? 0
  const doneCount = goal.subtasks?.filter((s) => s.done).length ?? 0
  const due = goal.dueDate ? daysUntil(goal.dueDate) : null
  const overdue = goal.status !== 'done' && due != null && due < 0
  const today = goal.status !== 'done' && due === 0

  const cat = CAT[goal.category]

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-line bg-surface transition-shadow ${expanded ? 'shadow-md' : 'shadow-sm'}`}
    >
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 size-2 shrink-0 rounded-full ${cat.dot}`}
          />
          <div className="min-w-0 flex-1">
            <h3
              className={`text-[15.5px] leading-snug font-semibold ${
                goal.status === 'done' ? 'text-faint line-through' : ''
              }`}
            >
              {goal.title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-subtle">
              <span className="inline-flex items-center gap-1">
                <Icon name="calendar" className="size-3.5" />
                {formatDate(goal.createdAt, { day: 'numeric', month: 'short' })}
              </span>

              {goal.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 ${
                    overdue
                      ? 'font-medium text-danger'
                      : today
                        ? 'font-medium text-warn'
                        : ''
                  }`}
                >
                  <Icon name="flag" className="size-3.5" />
                  {formatRelativeDays(goal.dueDate)}
                </span>
              )}

              {subtaskCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="check" className="size-3.5" />
                  {doneCount}/{subtaskCount}
                </span>
              )}
            </div>
          </div>
          <CycleStatus goal={goal} />
        </div>

        <div className="flex items-center gap-2 pl-5">
          <ProgressBar
            value={progress}
            className="flex-1"
            barClassName={progress >= 1 ? 'bg-ok' : cat.bar}
            height="h-1"
          />
          <span className="text-[11.5px] font-semibold tabular-nums text-subtle">
            {pct}%
          </span>
        </div>

        <div className="flex items-center gap-1 pl-5">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(goal)}
              aria-label="Modifier"
            >
              <Icon name="pencil" className="size-4" />
            </Button>
          )}
          {subtaskCount > 0 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Replier' : 'Déplier les sous-tâches'}
              aria-expanded={expanded}
            >
              <Icon
                name="chevron"
                className={`size-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </Button>
          )}

          {!confirming ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirming(true)}
              aria-label="Supprimer"
              className="ml-auto text-faint hover:text-danger"
            >
              <Icon name="trash" className="size-4" />
            </Button>
          ) : (
            <span className="anim-fade-in ml-auto flex items-center gap-1">
              <span className="text-[12px] text-subtle">Supprimer ?</span>
              <Button
                variant="danger-ghost"
                size="icon-sm"
                onClick={() => {
                  deleteGoal(goal.id)
                  setConfirming(false)
                }}
                aria-label="Confirmer la suppression"
              >
                <Icon name="check" className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfirming(false)}
                aria-label="Annuler"
              >
                <Icon name="x" className="size-4" />
              </Button>
            </span>
          )}
        </div>
      </div>

      {expanded && subtaskCount > 0 && (
        <div className="border-t border-line bg-canvas/60 px-4 py-3">
          <div className="flex flex-col gap-2.5">
            {goal.subtasks.map((st) => (
              <Checkbox
                key={st.id}
                checked={st.done}
                onChange={() => toggleSubtask(goal.id, st.id)}
                label={st.title}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}