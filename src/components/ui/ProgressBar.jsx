export default function ProgressBar({
  value = 0,
  className = '',
  barClassName = '',
  height = 'h-1.5',
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100

  return (
    <div
      className={`overflow-hidden rounded-full bg-line ${height} ${className}`}
    >
      <div
        className={`h-full rounded-full bg-accent transition-all duration-300 ease-out ${barClassName}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}