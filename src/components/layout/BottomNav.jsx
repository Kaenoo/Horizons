import { useGoals } from '../../store/goalsStore'
import { VIEWS } from '../../lib/constants'
import Icon from '../ui/Icon'

export default function BottomNav() {
  const view = useGoals((s) => s.activeView)
  const setView = useGoals((s) => s.setActiveView)

  return (
    <nav
      className="shrink-0 border-t border-line bg-surface/90 backdrop-blur-lg md:order-first md:w-64 md:border-t-0 md:border-r"
      aria-label="Navigation principale"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-4 safe-bottom md:flex md:h-full md:w-full md:max-w-none md:flex-col md:overflow-y-auto md:p-3">
        <p className="hidden px-3 pt-2 pb-4 text-[15px] font-bold tracking-tight md:block">
          Horizons
        </p>
        {VIEWS.map((item) => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 pt-2 pb-1.5 transition-colors ${
                active ? 'text-accent' : 'text-faint hover:text-subtle'
              } md:flex-row md:gap-3 md:rounded-xl md:px-3 md:py-2.5 ${
                active ? 'md:bg-accent-soft' : ''
              }`}
            >
              <span
                className={`absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-b-full transition-all md:hidden ${
                  active ? 'bg-accent' : 'bg-transparent'
                }`}
              />
              <Icon
                name={item.icon}
                className={`size-[22px] transition-transform md:size-5 ${
                  active ? 'scale-110 md:scale-100' : ''
                }`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className="text-[10.5px] font-medium tracking-tight md:text-[13.5px]">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}