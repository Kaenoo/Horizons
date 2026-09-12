import { useState } from 'react'
import { useGoals } from '../../store/goalsStore'
import Button from '../ui/Button'
import Icon from '../ui/Icon'

export default function QuickNote({ onOpenOptions }) {
  const addGoal = useGoals((s) => s.addGoal)
  const [title, setTitle] = useState('')

  const text = title.trim()

  const submit = () => {
    if (!text) return
    addGoal({ title: text, category: 'short' })
    setTitle('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex items-center gap-2 rounded-2xl border border-line bg-surface py-2 pl-3 pr-2 transition-colors focus-within:border-accent"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon name="pencil" className="size-4" />
      </span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Noter une chose à faire…"
        maxLength={120}
        aria-label="Note rapide"
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
      />
      {title.length > 0 && (
        <Button
          type="button"
          variant="subtle"
          size="icon-sm"
          aria-label="Plus d’options"
          onClick={() => onOpenOptions(text)}
        >
          <Icon name="chevron" className="size-4 -rotate-90" />
        </Button>
      )}
      <Button
        type="submit"
        size="icon"
        disabled={!text}
        aria-label="Ajouter"
        className="size-9 shrink-0"
      >
        <Icon name="plus" className="size-4.5" strokeWidth={2.4} />
      </Button>
    </form>
  )
}