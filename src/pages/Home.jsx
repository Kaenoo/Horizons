import { CATEGORIES } from '../lib/constants'
import { daysUntil, greeting, subtitleForDay, todayISO } from '../lib/format'
import { useGoals } from '../store/goalsStore'
import GoalCard from '../components/goals/GoalCard'
import StatCard from '../components/ui/StatCard'
import Icon from '../components/ui/Icon'

function CategoryPreview({ goals }) {
  const setView = useGoals((s) => s.setActiveView)
  const setTab = useGoals((s) => s.setHorizonsTab)

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-subtle uppercase">
        Mes horizons
      </h2>
      <div className="flex flex-col gap-2">
        {CATEGORIES.map((c) => {
          const list = goals.filter((g) => g.category === c.id)
          const done = list.filter((g) => g.status === 'done').length
          return (
            <button
              key={c.id}
              onClick={() => {
                setTab(c.id)
                setView('horizons')
              }}
              className="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-canvas active:bg-elevated"
            >
              <span className={`size-2 rounded-full ${c.color}`} />
              <span className="flex-1 text-left text-[14px] font-medium">
                {c.label} terme
              </span>
              <span className="text-[12.5px] text-subtle">
                {done}/{list.length} fini{list.length > 1 ? 's' : ''}
              </span>
              <Icon name="chevron" className="size-4 -rotate-90 text-faint" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Upcoming({ goals, onOpenForm }) {
  const now = todayISO()
  const upcoming = goals
    .filter((g) => g.status !== 'done' && g.dueDate && g.dueDate <= now)
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
    .slice(0, 3)

  if (upcoming.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-1.5 px-1 text-[13px] font-semibold tracking-wide text-subtle uppercase">
        <Icon name="flag" className="size-3.5 text-warn" />
        Échéances imminentes
      </h2>
      {upcoming.map((g) => (
        <GoalCard key={g.id} goal={g} onEdit={onOpenForm} />
      ))}
    </section>
  )
}

export default function Home({ onOpenForm }) {
  const goals = useGoals((s) => s.goals)
  const setView = useGoals((s) => s.setActiveView)

  const active = goals.filter((g) => g.status !== 'done').length
  const done = goals.filter((g) => g.status === 'done').length
  const total = goals.length
  const rate = total ? Math.round((done / total) * 100) : 0

  const soon = goals
    .filter((g) => {
      if (g.status === 'done' || !g.dueDate) return false
      const d = daysUntil(g.dueDate)
      return d != null && d <= 7
    })
    .length

  const inProgress = goals
    .filter((g) => g.status === 'in_progress')
    .slice(0, 2)

  return (
    <div className="anim-view flex flex-col gap-6 pb-6">
      <header className="safe-top flex flex-col gap-1 px-5">
        <p className="text-[13px] text-subtle">{subtitleForDay()}</p>
        <h1 className="text-[24px] leading-tight font-bold tracking-tight">
          {greeting()},
          <span className="text-accent"> c’est quoi la suite ?</span>
        </h1>
      </header>

      <div className="grid grid-cols-3 gap-2.5 px-5">
        <StatCard icon="target" label="En cours" value={active} accent />
        <StatCard icon="check" label="Terminés" value={done} />
        <StatCard icon="chart" label="Taux" value={`${rate}%`} />
      </div>

      {inProgress.length > 0 && (
        <section className="flex flex-col gap-3 px-5">
          <h2 className="text-[13px] font-semibold tracking-wide text-subtle uppercase">
            En cours
          </h2>
          {inProgress.map((g) => (
            <GoalCard key={g.id} goal={g} onEdit={onOpenForm} />
          ))}
        </section>
      )}

      <section className="px-5">
        <Upcoming goals={goals} onOpenForm={onOpenForm} />
      </section>

      {done === 0 && total === 0 ? (
        <section className="px-5">
          <button
            onClick={() => setView('horizons')}
            className="anim-fade-in flex w-full items-center gap-4 rounded-2xl border border-dashed border-line bg-surface p-4 text-left transition-colors hover:border-accent"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name="sparkles" className="size-5" />
            </span>
            <span>
              <span className="block text-[14.5px] font-semibold">
                Commencez votre premier objectif
              </span>
              <span className="block text-[12.5px] text-subtle">
                Court, moyen ou long terme — tout se passe hors-ligne.
              </span>
            </span>
            <Icon name="chevron" className="ml-auto size-4 -rotate-90 text-faint" />
          </button>
        </section>
      ) : (
        <section className="px-5">
          <CategoryPreview goals={goals} />
        </section>
      )}

      {soon > 0 && (
        <p className="px-5 text-center text-[12px] text-subtle">
          <Icon name="clock" className="mr-1 inline size-3.5 align-[-2px]" />
          {soon} objectif{soon > 1 ? 's' : ''} à moins de 7 jours
        </p>
      )}
    </div>
  )
}