export default function Button({
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium select-none transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40'

  const variants = {
    default: 'bg-accent text-on-accent active:scale-[.97] hover:bg-accent-strong',
    ghost:
      'bg-transparent text-ink hover:bg-elevated active:bg-line active:scale-[.98]',
    subtle:
      'bg-elevated text-subtle hover:text-ink active:bg-line',
    danger:
      'bg-danger text-white active:scale-[.97] hover:opacity-90',
    'danger-ghost':
      'bg-transparent text-danger hover:bg-danger-soft active:bg-danger-soft',
  }

  const sizes = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
    icon: 'size-9 rounded-lg p-0',
    'icon-sm': 'size-8 rounded-lg p-0',
  }

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.md} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}