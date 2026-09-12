import { CATEGORIES } from '../../lib/constants'
import { useGoals } from '../../store/goalsStore'

const COLORS = {
  short: 'bg-court',
  medium: 'bg-moyen',
  long: 'bg-long',
}

const LIGHT = {
  short: 'text-court',
  medium: 'text-moyen',
  long: 'text-long',
}

export default function GoalTabs() {
  const tab = useGoals((s) => s.horizonsTab)
  const setTab = useGoals((s) => s.setHorizonsTab)
  const goals = useGoals((s) => s.goals)

  const index = CATEGORIES.findIndex((c) => c.id === tab)
  const n = CATEGORIES.length

  return (
    <div className="relative rounded-[14px] bg-elevated p-1">
      <div
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 rounded-[10px] bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]"
        style={{
          width: `calc((100% - 8px) / ${n})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      <div className="relative grid grid-cols-3">
        {CATEGORIES.map((cat) => {
          const active = tab === cat.id
          const count = goals.filter((g) => g.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setTab(cat.id)}
              className="flex flex-col items-center gap-0.5 py-2.5"
            >
              <span
                className={`text-[14px] font-semibold transition-colors duration-200 ${
                  active ? LIGHT[cat.id] : 'text-subtle'
                }`}
              >
                {cat.label}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-faint">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${active ? COLORS[cat.id] : 'bg-line'}`}
                />
                {count} {count > 1 ? 'objectifs' : 'objectif'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}