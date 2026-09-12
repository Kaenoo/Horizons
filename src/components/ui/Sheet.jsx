import { useEffect } from 'react'
import Icon from './Icon'

export default function Sheet({
  open = false,
  onClose,
  title,
  children,
  icon,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] anim-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="anim-sheet-up flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem] border-t border-white/10 bg-surface shadow-2xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line" />

        <div className="flex items-center gap-3 px-5 pb-1 pt-3">
          {icon && (
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name={icon} className="size-5" />
            </span>
          )}
          <h2 className="flex-1 text-[17px] font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-9 items-center justify-center rounded-xl bg-elevated text-subtle hover:text-ink"
          >
            <Icon name="x" className="size-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2"
        >
          {children}
        </div>
      </div>
    </div>
  )
}