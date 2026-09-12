import { CATEGORIES } from '../../lib/constants'
import { goalProgress } from '../../store/goalsStore'

const BAR = {
  short: 'bg-court',
  medium: 'bg-moyen',
  long: 'bg-long',
}

export default function StatsBars({ goals }) {
  const rows = CATEGORIES.map((c) => {
    const list = goals.filter((g) => g.category === c.id)
    const avg = list.length
      ? list.reduce((sum, g) => sum + goalProgress(g), 0) / list.length
      : 0
    const done = list.filter((g) => g.status === 'done').length
    return { ...c, count: list.length, done, avg }
  })

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-[12.5px] font-medium text-subtle">
            {row.label}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all duration-500 ${BAR[row.id]}`}
              style={{ width: `${row.avg * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-[11.5px] tabular-nums text-subtle">
            {row.done}/{row.count} fini{row.done > 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}