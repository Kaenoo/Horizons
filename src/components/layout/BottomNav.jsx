import { useGoals } from '../../store/goalsStore'
import { VIEWS } from '../../lib/constants'
import Icon from '../ui/Icon'

export default function BottomNav() {
  const view = useGoals((s) => s.activeView)
  const setView = useGoals((s) => s.setActiveView)

  return (
    <nav
      className="shrink-0 border-t border-line bg-surface/90 backdrop-blur-lg"
      aria-label="Navigation principale"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-4 safe-bottom">
        {VIEWS.map((item) => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 pt-2 pb-1.5 transition-colors ${
                active ? 'text-accent' : 'text-faint hover:text-subtle'
              }`}
            >
              <span
                className={`absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-b-full transition-all ${
                  active ? 'bg-accent' : 'bg-transparent'
                }`}
              />
              <Icon
                name={item.icon}
                className={`size-[22px] transition-transform ${active ? 'scale-110' : ''}`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className="text-[10.5px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}