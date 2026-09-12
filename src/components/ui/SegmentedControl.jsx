import Icon from './Icon'

export default function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex w-full rounded-[14px] bg-elevated p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-[13px] font-medium transition-all ${
              active
                ? 'bg-surface text-ink shadow-sm'
                : 'text-subtle hover:text-ink'
            }`}
          >
            {opt.icon && (
              <Icon name={opt.icon} className={`size-4 ${active ? 'text-accent' : ''}`} />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}