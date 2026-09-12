import { useCallback, useRef, useState } from 'react'
import Icon from './Icon'

export default function Checkbox({ checked = false, onChange, label, className = '' }) {
  const ref = useRef(null)
  const [justChecked, setJustChecked] = useState(false)

  const toggle = useCallback(() => {
    if (!onChange) return
    onChange(!checked)
    if (!checked) {
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 250)
    }
  }, [checked, onChange])

  return (
    <label
      className={`flex items-start gap-3 ${className}`}
      role="checkbox"
      tabIndex={0}
      aria-checked={checked}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          toggle()
        }
      }}
    >
      <span
        ref={ref}
        onClick={toggle}
        className={`mt-[3px] flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border-[1.5px] transition-all
          ${
            checked
              ? 'border-accent bg-accent text-on-accent'
              : 'border-line bg-transparent hover:border-faint'
          }
          ${justChecked ? 'anim-check' : ''}
        `}
      >
        {checked && <Icon name="check" className="size-3" strokeWidth={3} />}
      </span>
      {label != null && (
        <span
          onClick={toggle}
          className={`select-none text-[14px] leading-[1.35] transition-colors ${
            checked ? 'text-faint line-through' : 'text-ink'
          }`}
        >
          {label}
        </span>
      )}
    </label>
  )
}