import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, STATUSES } from '../../lib/constants'
import {
  datetimeLocalToISO,
  isoToDateTimeLocal,
  uid,
} from '../../lib/format'
import { RECURRENCES } from '../../lib/recurrence'
import { useGoals } from '../../store/goalsStore'
import Button from '../ui/Button'
import Checkbox from '../ui/Checkbox'
import Icon from '../ui/Icon'
import SegmentedControl from '../ui/SegmentedControl'
import Sheet from '../ui/Sheet'
import Switch from '../ui/Switch'

const RECURRENCE_SHORT = {
  none: 'Aucune',
  daily: 'Jour',
  weekly: 'Semaine',
  monthly: 'Mois',
  yearly: 'Année',
}

function defaultDatetimeLocal() {
  const d = new Date(Date.now() + 3600000)
  d.setMinutes(0, 0, 0)
  return isoToDateTimeLocal(d.toISOString())
}

function draftFromGoal(goal, initialTitle) {
  const raw = goal?.reminder
  return {
    title: goal?.title ?? initialTitle ?? '',
    category: goal?.category ?? 'short',
    status: goal?.status ?? 'todo',
    dueDate: goal?.dueDate ?? '',
    reminder: raw
      ? {
          enabled: true,
          datetime: isoToDateTimeLocal(raw.datetime),
          recurrence: raw.recurrence,
        }
      : { enabled: false, datetime: '', recurrence: 'none' },
    subtasks: (goal?.subtasks ?? []).map((s) => ({ ...s })),
  }
}

export default function GoalForm({ goal, initialTitle, onClose }) {
  const addGoal = useGoals((s) => s.addGoal)
  const updateGoal = useGoals((s) => s.updateGoal)

  const [draft, setDraft] = useState(() => draftFromGoal(goal, initialTitle))
  const [dirty, setDirty] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 180)
    return () => clearTimeout(t)
  }, [])

  const editing = Boolean(goal)
  const canSave = draft.title.trim().length > 0

  const patch = (p) => {
    setDraft((d) => ({ ...d, ...p }))
    setDirty(true)
  }

  const addSubtask = () => {
    patch({
      subtasks: [
        ...draft.subtasks,
        { id: uid(), title: '', done: false },
      ],
    })
  }

  const bumpSubtask = (index, p) => {
    patch({
      subtasks: draft.subtasks.map((s, i) => (i === index ? { ...s, ...p } : s)),
    })
  }

  const removeSubtask = (index) => {
    patch({
      subtasks: draft.subtasks.filter((_, i) => i !== index),
    })
  }

  const save = () => {
    if (!canSave) return
    const subtasks = draft.subtasks
      .map((s) => ({ id: s.id, title: s.title.trim(), done: s.done }))
      .filter((s) => s.title.length > 0)
    const reminder =
      draft.reminder.enabled && draft.reminder.datetime
        ? {
            datetime: datetimeLocalToISO(draft.reminder.datetime),
            recurrence: draft.reminder.recurrence,
          }
        : null
    if (editing) {
      updateGoal(goal.id, {
        title: draft.title.trim(),
        category: draft.category,
        status: draft.status,
        dueDate: draft.dueDate || null,
        reminder,
        subtasks,
      })
    } else {
      addGoal({
        title: draft.title.trim(),
        category: draft.category,
        dueDate: draft.dueDate || null,
        reminder,
        subtasks: subtasks.map((s) => ({ ...s, title: s.title })),
      })
    }
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      icon={editing ? 'pencil' : 'plus'}
      title={editing ? 'Modifier l’objectif' : 'Nouvel objectif'}
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-subtle">
            Titre
          </label>
          <input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Ex. Courir un semi-marathon"
            maxLength={120}
            className="w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-subtle">
            Horizon
          </label>
          <SegmentedControl
            options={CATEGORIES}
            value={draft.category}
            onChange={(category) => patch({ category })}
          />
        </div>

        {editing && (
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-subtle">
              Statut
            </label>
            <SegmentedControl
              options={STATUSES}
              value={draft.status}
              onChange={(status) => patch({ status })}
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-subtle">
            Échéance <span className="text-faint">(optionnel)</span>
          </label>
          <input
            type="date"
            value={draft.dueDate ? isoToDateValue(draft.dueDate) : ''}
            min={isoToDateValue(new Date().toISOString())}
            onChange={(e) => patch({ dueDate: e.target.value || null })}
            className="w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="rounded-2xl border border-line bg-canvas/60 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-medium">Rappel</p>
              <p className="text-[12px] text-subtle">Notification à une date et une heure.</p>
            </div>
            <Switch
              checked={draft.reminder.enabled}
              onChange={(enabled) =>
                patch({
                  reminder: {
                    ...draft.reminder,
                    enabled,
                    datetime: enabled && !draft.reminder.datetime ? defaultDatetimeLocal() : draft.reminder.datetime,
                  },
                })
              }
            />
          </div>

          {draft.reminder.enabled && (
            <div className="mt-3.5 flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-subtle">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  value={draft.reminder.datetime}
                  onChange={(e) =>
                    patch({
                      reminder: { ...draft.reminder, datetime: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-[15px] outline-none transition-colors focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-subtle">
                  Répéter
                </label>
                <SegmentedControl
                  options={RECURRENCES.map((r) => ({
                    id: r.id,
                    label: RECURRENCE_SHORT[r.id] ?? r.label,
                  }))}
                  value={draft.reminder.recurrence}
                  onChange={(recurrence) =>
                    patch({ reminder: { ...draft.reminder, recurrence } })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[12.5px] font-medium text-subtle">
              Sous-tâches{' '}
              <span className="text-faint">({draft.subtasks.length})</span>
            </label>
            <button
              onClick={addSubtask}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline"
            >
              <Icon name="plus" className="size-3.5" strokeWidth={2.4} />
              Ajouter
            </button>
          </div>

          {draft.subtasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-[12.5px] text-faint">
              Aucune sous-tâche. Ajoutez-en pour suivre la progression.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {draft.subtasks.map((st, i) => (
                <div
                  key={st.id}
                  className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-2 py-1.5"
                >
                  <Checkbox
                    checked={st.done}
                    onChange={(v) => bumpSubtask(i, { done: v })}
                  />
                  <input
                    value={st.title}
                    onChange={(e) => bumpSubtask(i, { title: e.target.value })}
                    placeholder="Sous-tâche…"
                    maxLength={120}
                    className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
                  />
                  <button
                    onClick={() => removeSubtask(i)}
                    aria-label="Retirer la sous-tâche"
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-faint hover:bg-danger-soft hover:text-danger"
                  >
                    <Icon name="x" className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button className="flex-1" disabled={!canSave} onClick={save}>
            {editing ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>

        {dirty && !canSave && (
          <p className="anim-fade-in -mt-2 text-center text-[12px] text-faint">
            Le titre est requis.
          </p>
        )}
      </div>
    </Sheet>
  )
}