import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { createPersister, loadState, makeKey } from './persistence'
import { uid } from '../lib/format'

const GOALS_KEY = makeKey('goals')
const STATE_VERSION = 1

export function goalProgress(goal) {
  if (!goal || !Array.isArray(goal.subtasks) || goal.subtasks.length === 0) {
    return goal?.status === 'done' ? 1 : 0
  }
  const done = goal.subtasks.filter((s) => s?.done).length
  return done / goal.subtasks.length
}

export function isGoalDone(goal) {
  return goal?.status === 'done'
}

function normalizeSubtask(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    id: typeof raw.id === 'string' ? raw.id : uid(),
    title: typeof raw.title === 'string' ? raw.title : '',
    done: Boolean(raw.done),
  }
}

export function normalizeGoal(raw) {
  if (!raw || typeof raw !== 'object') return null
  const category = ['short', 'medium', 'long'].includes(raw.category)
    ? raw.category
    : 'short'
  const status = ['todo', 'in_progress', 'done'].includes(raw.status)
    ? raw.status
    : 'todo'
  return {
    id: typeof raw.id === 'string' ? raw.id : uid(),
    title: typeof raw.title === 'string' ? raw.title : 'Sans titre',
    category,
    status,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    dueDate: typeof raw.dueDate === 'string' ? raw.dueDate : null,
    subtasks: Array.isArray(raw.subtasks)
      ? raw.subtasks.map(normalizeSubtask).filter(Boolean)
      : [],
  }
}

function loadGoals() {
  const data = loadState(GOALS_KEY, null)
  const list = data && Array.isArray(data.goals) ? data.goals : []
  return list.map(normalizeGoal).filter(Boolean)
}

export const useGoals = create((set, _get) => ({
  goals: loadGoals(),
  hasHydrated: true,
  activeView: 'home',
  horizonsTab: 'short',

  setActiveView: (view) => set({ activeView: view }),
  setHorizonsTab: (tab) => set({ horizonsTab: tab }),

  addGoal: ({ title, category = 'short', dueDate = null, status = 'todo', subtasks = [] }) => {
    const now = new Date().toISOString()
    const goal = normalizeGoal({
      id: uid(),
      title,
      category,
      status,
      dueDate: dueDate || null,
      subtasks,
      createdAt: now,
      updatedAt: now,
    })
    set((s) => ({ goals: [goal, ...s.goals] }))
    return goal.id
  },

  updateGoal: (id, patch) => {
    const updatedAt = new Date().toISOString()
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id
          ? normalizeGoal({
              ...g,
              ...patch,
              subtasks: Array.isArray(patch.subtasks)
                ? patch.subtasks
                : g.subtasks,
              updatedAt,
            })
          : g,
      ),
    }))
  },

  deleteGoal: (id) => {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
  },

  setStatus: (id, status) => {
    const updatedAt = new Date().toISOString()
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id ? { ...g, status, updatedAt } : g,
      ),
    }))
  },

  toggleSubtask: (goalId, subtaskId) => {
    const updatedAt = new Date().toISOString()
    set((s) => ({
      goals: s.goals.map((g) => {
        if (g.id !== goalId) return g
        const subtasks = g.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, done: !st.done } : st,
        )
        const total = subtasks.length
        const done = subtasks.filter((st) => st.done).length
        let status = g.status
        if (total > 0 && done === total) status = 'done'
        else if (done > 0 && status === 'todo') status = 'in_progress'
        return { ...g, subtasks, status, updatedAt }
      }),
    }))
  },

  resetAll: () => {
    set({ goals: [] })
    persister.clear()
  },

  importGoals: (incoming, { replace = false } = {}) => {
    const normalized = incoming.map(normalizeGoal).filter(Boolean)
    set((s) => {
      const goals = replace
        ? normalized
        : [
            ...s.goals,
            ...normalized.filter((g) => !s.goals.some((x) => x.id === g.id)),
          ]
      return { goals }
    })
  },
}))

const persister = createPersister(GOALS_KEY, { delay: 250 })

useGoals.subscribe((state) => {
  if (state.hasHydrated) {
    persister.schedule({ version: STATE_VERSION, goals: state.goals })
  }
})

if (typeof window !== 'undefined') {
  const flush = () => persister.flush()
  window.addEventListener('beforeunload', flush)
  window.addEventListener('pagehide', flush)

  window.addEventListener('storage', (e) => {
    if (e.key !== GOALS_KEY) return
    useGoals.setState({ goals: loadGoals() })
  })
}

export const useView = (view) =>
  useGoals(useShallow((s) => ({ active: s.activeView === view, view: s.activeView })))

export const useGoalById = (id) =>
  useGoals(
    useShallow((s) => s.goals.find((g) => g.id === id) ?? null),
  )

export const useGoalsOfCategory = (category) =>
  useGoals(
    useShallow((s) => s.goals.filter((g) => g.category === category)),
  )