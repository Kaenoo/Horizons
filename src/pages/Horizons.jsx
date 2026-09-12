import { useState } from 'react'
import { CATEGORY_MAP, STATUS_MAP } from '../lib/constants'
import { useGoals, useGoalsOfCategory } from '../store/goalsStore'
import EmptyState from '../components/ui/EmptyState'
import GoalCard from '../components/goals/GoalCard'
import GoalTabs from '../components/goals/GoalTabs'
import Icon from '../components/ui/Icon'

function StatusFilter({ value, onChange, counts }) {
  const options = [
    { id: 'all', label: 'Tout' },
    { id: 'todo', label: STATUS_MAP.todo.label },
    { id: 'in_progress', label: STATUS_MAP.in_progress.label },
    { id: 'done', label: STATUS_MAP.done.label },
  ]

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
      {options.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all ${
              active
                ? 'bg-accent text-on-accent'
                : 'bg-elevated text-subtle hover:text-ink'
            }`}
          >
            {o.label}
            <span className={`ml-1.5 tabular-nums ${active ? '' : 'text-faint'}`}>
              {counts[o.id]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function Horizons({ onOpenForm }) {
  const tab = useGoals((s) => s.horizonsTab)
  const categoryGoals = useGoalsOfCategory(tab)

  const [statusFilter, setStatusFilter] = useState('all')

  const baseCounts = {
    all: categoryGoals.length,
    todo: categoryGoals.filter((g) => g.status === 'todo').length,
    in_progress: categoryGoals.filter((g) => g.status === 'in_progress').length,
    done: categoryGoals.filter((g) => g.status === 'done').length,
  }

  const visible =
    statusFilter === 'all'
      ? categoryGoals
      : categoryGoals.filter((g) => g.status === statusFilter)

  const cat = CATEGORY_MAP[tab]

  return (
    <div className="anim-view flex flex-col gap-4 pb-6">
      <header className="safe-top flex items-center justify-between px-5">
        <div>
          <p className="text-[13px] text-subtle">Trois horizons, un cap</p>
          <h1 className="text-[24px] font-bold tracking-tight">Horizons</h1>
        </div>
        <button
          onClick={() => onOpenForm()}
          aria-label="Nouvel objectif"
          className="flex size-11 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-lg shadow-accent/25 transition-all active:scale-95"
        >
          <Icon name="plus" className="size-6" strokeWidth={2.4} />
        </button>
      </header>

      <div className="px-5">
        <GoalTabs />
      </div>

      <p className="px-5 text-[12.5px] text-subtle">
        <span className={`mr-1.5 inline-block size-2 rounded-full ${cat.color}`} />
        {cat.hint} · {baseCounts.all} objectif{baseCounts.all > 1 ? 's' : ''}
      </p>

      {categoryGoals.length > 0 && (
        <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={baseCounts} />
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={categoryGoals.length === 0 ? 'inbox' : 'target'}
          title={
            categoryGoals.length === 0
              ? `Aucun objectif ${cat.label.toLowerCase()}`
              : 'Aucun ici'
          }
          text={
            categoryGoals.length === 0
              ? 'Créez votre premier objectif, il sera sauvegardé sur cet appareil.'
              : 'Modifiez le filtre ou avancez sur vos objectifs.'
          }
          action={
            categoryGoals.length === 0 ? (
              <button
                onClick={() => onOpenForm()}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent active:scale-95"
              >
                <Icon name="plus" className="size-4" />
                Créer un objectif
              </button>
            ) : null
          }
        />
      ) : (
        <div key={statusFilter} className="anim-fade-in flex flex-col gap-3 px-5">
          {visible.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={onOpenForm} />
          ))}
        </div>
      )}
    </div>
  )
}