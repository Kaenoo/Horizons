import Icon from './Icon'

export default function StatCard({ icon, label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5">
      <span
        className={`mb-2 flex size-8 items-center justify-center rounded-lg ${
          accent ? 'bg-accent-soft text-accent' : 'bg-elevated text-subtle'
        }`}
      >
        <Icon name={icon} className="size-4" />
      </span>
      <p className="text-[22px] leading-none font-bold tabular-nums">{value}</p>
      <p className="mt-1.5 text-[11.5px] font-medium text-subtle">{label}</p>
    </div>
  )
}