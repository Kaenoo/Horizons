import { useGoals } from '../store/goalsStore'
import { STATUSES, STATUS_MAP } from '../lib/constants'
import Ring from '../components/stats/Ring'
import StatsBars from '../components/stats/StatsBars'
import EmptyState from '../components/ui/EmptyState'
import Icon from '../components/ui/Icon'

const STATUS_DOT = {
  todo: 'bg-elevated',
  in_progress: 'bg-moyen',
  done: 'bg-ok',
}

export default function Stats() {
  const goals = useGoals((s) => s.goals)

  const total = goals.length
  const done = goals.filter((g) => g.status === 'done').length
  const inProgress = goals.filter((g) => g.status === 'in_progress').length
  const todo = goals.filter((g) => g.status === 'todo').length
  const rate = total ? Math.round((done / total) * 100) : 0

  const subtaskTotal = goals.reduce((n, g) => n + (g.subtasks?.length ?? 0), 0)
  const subtaskDone = goals.reduce(
    (n, g) => n + (g.subtasks?.filter((s) => s.done).length ?? 0),
    0,
  )
  const subtaskRate = subtaskTotal
    ? Math.round((subtaskDone / subtaskTotal) * 100)
    : done && total
      ? rate
      : 0

  return (
    <div className="anim-view flex flex-col gap-6 pb-6">
      <header className="safe-top px-5 pt-5">
        <p className="text-[13px] text-subtle">Votre progression</p>
        <h1 className="text-[24px] font-bold tracking-tight">Stats</h1>
      </header>

      {total === 0 ? (
        <EmptyState
          icon="chart"
          title="Pas encore de données"
          text="Ajoutez des objectifs pour voir apparaître vos statistiques ici."
        />
      ) : (
        <>
          <section className="flex flex-col items-center gap-2 px-5">
            <Ring value={total ? done / total : 0} size={152} stroke={11}>
              <span className="text-[30px] leading-none font-bold tabular-nums text-ink">
                {rate}%
              </span>
              <span className="mt-1.5 text-center text-[11.5px] leading-snug text-subtle">
                {done}/{total} objectif{done > 1 ? 's' : ''} accompli{done > 1 ? 's' : ''}
              </span>
            </Ring>
          </section>

          <section className="mx-5 rounded-2xl border border-line bg-surface p-4">
            <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-subtle uppercase">
              Par horizon
            </h2>
            <StatsBars goals={goals} />
          </section>

          <section className="mx-5 rounded-2xl border border-line bg-surface p-4">
            <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-subtle uppercase">
              Sous-tâches
            </h2>
            <div className="flex items-center gap-4">
              <Ring value={subtaskRate / 100} size={72} stroke={7}>
                <span className="text-[15px] font-bold tabular-nums">{subtaskRate}%</span>
              </Ring>
              <p className="text-[13px] text-subtle">
                <span className="font-semibold text-ink">{subtaskDone}</span> sur{' '}
                <span className="font-semibold text-ink">{subtaskTotal}</span>{' '}
                sous-tâches cochées.
              </p>
            </div>
          </section>

          <section className="mx-5 rounded-2xl border border-line bg-surface p-4">
            <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-subtle uppercase">
              Par statut
            </h2>
            <div className="flex flex-col gap-2.5">
              {STATUSES.map((s) => {
                const count = s.id === 'todo' ? todo : s.id === 'in_progress' ? inProgress : done
                const pct = total ? Math.round((count / total) * 100) : 0
                return (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[s.id]}`} />
                    <span className="flex-1 text-[13.5px]">{STATUS_MAP[s.id].label}</span>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${STATUS_DOT[s.id]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[12.5px] font-medium tabular-nums text-subtle">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <p className="flex items-center justify-center gap-1.5 px-5 text-[12px] text-faint">
            <Icon name="lock" className="size-3.5" />
            Statistiques calculées localement
          </p>
        </>
      )}
    </div>
  )
}