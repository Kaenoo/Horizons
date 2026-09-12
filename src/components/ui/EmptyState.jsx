import Icon from './Icon'

export default function EmptyState({ icon = 'inbox', title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-elevated text-faint">
        <Icon name={icon} className="size-7" />
      </span>
      <div>
        <p className="text-[15px] font-semibold">{title}</p>
        {text && <p className="mt-1 text-[13px] text-subtle">{text}</p>}
      </div>
      {action}
    </div>
  )
}