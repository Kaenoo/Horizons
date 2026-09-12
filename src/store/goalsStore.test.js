import { beforeEach, describe, expect, it } from 'vitest'
import {
  dueReminders,
  goalProgress,
  normalizeGoal,
  normalizeReminder,
  upcomingReminders,
  useGoals,
} from './goalsStore'
import { advanceToFuture } from '../lib/recurrence'

function resetStore() {
  useGoals.setState({
    goals: [],
    hasHydrated: true,
    activeView: 'home',
    horizonsTab: 'short',
  })
}

function makeGoal(overrides = {}) {
  return {
    id: 'g1',
    title: 'Courir un semi',
    category: 'short',
    status: 'todo',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
    dueDate: null,
    subtasks: [
      { id: 's1', title: 'S’entraîner', done: false },
      { id: 's2', title: 'S’inscrire', done: false },
    ],
    ...overrides,
  }
}

function seed(overrides = {}) {
  const g = makeGoal(overrides)
  return useGoals.getState().addGoal({
    title: g.title,
    category: g.category,
    status: g.status,
    dueDate: g.dueDate,
    subtasks: g.subtasks,
  })
}

beforeEach(() => {
  localStorage.clear()
  resetStore()
})

describe('normalizeGoal', () => {
  it('retourne null pour une entrée invalide', () => {
    expect(normalizeGoal(null)).toBeNull()
    expect(normalizeGoal(undefined)).toBeNull()
    expect(normalizeGoal('x')).toBeNull()
  })

  it('complète les champs manquants avec des valeurs par défaut', () => {
    const g = normalizeGoal({ title: 'T' })
    expect(g.title).toBe('T')
    expect(g.category).toBe('short')
    expect(g.status).toBe('todo')
    expect(g.dueDate).toBeNull()
    expect(g.reminder).toBeNull()
    expect(g.subtasks).toEqual([])
    expect(g.id).toBeTruthy()
    expect(g.createdAt).toBeTruthy()
    expect(g.updatedAt).toBeTruthy()
  })

  it('assainit les valeurs invalides', () => {
    const g = normalizeGoal({
      id: 123,
      title: 42,
      category: 'ultra',
      status: 'bonjour',
      subtasks: [{ id: 'a', title: 'ok', done: 'yes' }, null, 'nope'],
      reminder: { datetime: 42, recurrence: 'hebdoh' },
    })
    expect(typeof g.id).toBe('string')
    expect(g.title).toBe('Sans titre')
    expect(g.category).toBe('short')
    expect(g.status).toBe('todo')
    expect(g.subtasks).toHaveLength(1)
    expect(g.subtasks[0].done).toBe(true)
    expect(g.reminder).toBeNull()
  })

  it('normalise un rappel valide', () => {
    const g = normalizeGoal({
      title: 'T',
      reminder: {
        datetime: '2026-09-20T14:30:00.000Z',
        recurrence: 'weekly',
        nextAt: '2026-09-27T14:30:00.000Z',
      },
    })
    expect(g.reminder).toEqual({
      datetime: '2026-09-20T14:30:00.000Z',
      recurrence: 'weekly',
      nextAt: '2026-09-27T14:30:00.000Z',
    })
  })
})

describe('normalizeReminder', () => {
  it('rejette les entrées invalides', () => {
    expect(normalizeReminder(null)).toBeNull()
    expect(normalizeReminder({})).toBeNull()
    expect(normalizeReminder({ datetime: 'pas une date' })).toBeNull()
    expect(normalizeReminder({ datetime: '2026-09-20T09:00:00.000Z', recurrence: 'bogus' })).toEqual({
      datetime: '2026-09-20T09:00:00.000Z',
      recurrence: 'none',
      nextAt: '2026-09-20T09:00:00.000Z',
    })
  })

  it('nextAt retombe sur datetime quand absent', () => {
    expect(normalizeReminder({ datetime: '2026-09-20T09:00:00.000Z' })).toEqual({
      datetime: '2026-09-20T09:00:00.000Z',
      recurrence: 'none',
      nextAt: '2026-09-20T09:00:00.000Z',
    })
  })
})

describe('CRUD du store', () => {
  it('addGoal ajoute en tête avec un id et un statut par défaut', () => {
    const id = useGoals.getState().addGoal({ title: 'Apprendre React', category: 'medium' })
    const goals = useGoals.getState().goals
    expect(goals).toHaveLength(1)
    expect(goals[0].id).toBe(id)
    expect(goals[0].title).toBe('Apprendre React')
    expect(goals[0].category).toBe('medium')
    expect(goals[0].status).toBe('todo')
  })

  it('updateGoal fusionne et met à jour updatedAt', () => {
    const id = seed()
    useGoals.getState().updateGoal(id, { title: 'Nouveau titre' })
    const g = useGoals.getState().goals[0]
    expect(g.id).toBe(id)
    expect(g.title).toBe('Nouveau titre')
    expect(new Date(g.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date('2025-01-01T10:00:00.000Z').getTime(),
    )
  })

  it('deleteGoal retire l’objectif', () => {
    const id = seed()
    useGoals.getState().deleteGoal(id)
    expect(useGoals.getState().goals).toHaveLength(0)
  })

  it('setStatus modifie le statut', () => {
    const id = seed()
    useGoals.getState().setStatus(id, 'done')
    expect(useGoals.getState().goals[0].status).toBe('done')
  })
})

describe('toggleSubtask et statut auto', () => {
  it('passe en in_progress dès qu’une sous-tâche est cochée', () => {
    const id = seed()
    useGoals.getState().toggleSubtask(id, 's1')
    expect(useGoals.getState().goals[0].status).toBe('in_progress')
  })

  it('passe en done quand toutes les sous-tâches sont cochées', () => {
    const id = seed()
    useGoals.getState().toggleSubtask(id, 's1')
    useGoals.getState().toggleSubtask(id, 's2')
    expect(useGoals.getState().goals[0].status).toBe('done')
  })

  it('ne recule pas vers todo en décochent une sous-tâche', () => {
    const id = seed()
    useGoals.getState().toggleSubtask(id, 's1')
    useGoals.getState().toggleSubtask(id, 's1')
    expect(useGoals.getState().goals[0].status).toBe('in_progress')
  })

  it('sans sous-tâches, le statut reste stable', () => {
    const id = seed({ subtasks: [] })
    useGoals.getState().toggleSubtask(id, 'inexistante')
    expect(useGoals.getState().goals[0].status).toBe('todo')
  })
})

describe('goalProgress', () => {
  it('0 sans sous-tâches', () => {
    expect(goalProgress(makeGoal({ subtasks: [] }))).toBe(0)
  })

  it('1 si statut done sans sous-tâches', () => {
    expect(goalProgress(makeGoal({ subtasks: [], status: 'done' }))).toBe(1)
  })

  it('ratio selon les sous-tâches cochées', () => {
    const g = makeGoal({
      subtasks: [
        { id: 's1', title: 'a', done: true },
        { id: 's2', title: 'b', done: false },
      ],
    })
    expect(goalProgress(g)).toBe(0.5)
  })
})

describe('importGoals', () => {
  it('remplace les données lorsque replace=true', () => {
    useGoals.setState(() => ({
      goals: [makeGoal({ id: 'old', title: 'Ancien' })],
    }))
    useGoals.getState().importGoals([makeGoal({ id: 'zz', title: 'Importé' })], {
      replace: true,
    })
    expect(useGoals.getState().goals.map((g) => g.id)).toEqual(['zz'])
  })

  it('fusionne sans doublons par défaut', () => {
    useGoals.setState(() => ({
      goals: [makeGoal({ id: 'g1', title: 'Existante' })],
    }))
    useGoals
      .getState()
      .importGoals([makeGoal({ id: 'g2', title: 'Nouvelle' }), makeGoal({ id: 'g1', title: 'Doublon' })])
    const goals = useGoals.getState().goals
    expect(goals.map((g) => g.id)).toContain('g2')
    expect(goals.filter((g) => g.id === 'g1')).toHaveLength(1)
    expect(goals.filter((g) => g.id === 'g1')[0].title).toBe('Existante')
  })

  it('ignore les entrées invalides', () => {
    useGoals.getState().importGoals([null, 'x', makeGoal({ id: 'ok' })])
    expect(useGoals.getState().goals.map((g) => g.id)).toEqual(['ok'])
  })
})

describe('resetAll', () => {
  it('vide la liste et le localStorage', () => {
    seed()
    useGoals.getState().resetAll()
    expect(useGoals.getState().goals).toEqual([])
    expect(localStorage.getItem('horizons:goals:v1')).toBeNull()
  })
})

describe('rappels (reminder)', () => {
  it('addGoal accepte un rappel', () => {
    const id = useGoals.getState().addGoal({
      title: 'Avec rappel',
      reminder: {
        datetime: '2026-09-20T09:00:00.000Z',
        recurrence: 'daily',
      },
    })
    const g = useGoals.getState().goals.find((x) => x.id === id)
    expect(g.reminder).toEqual({
      datetime: '2026-09-20T09:00:00.000Z',
      recurrence: 'daily',
      nextAt: '2026-09-20T09:00:00.000Z',
    })
  })

  it('updateGoal peut effacer un rappel', () => {
    const id = useGoals.getState().addGoal({
      title: 'R',
      reminder: { datetime: '2026-09-20T09:00:00.000Z', recurrence: 'none' },
    })
    useGoals.getState().updateGoal(id, { reminder: null })
    expect(useGoals.getState().goals[0].reminder).toBeNull()
  })

  it('advanceReminder saute à la prochaine occurrence future', () => {
    const now = new Date()
    const base = new Date(now.getTime() - 86400000).toISOString()
    const id = useGoals.getState().addGoal({
      title: 'Quotidien',
      reminder: { datetime: base, recurrence: 'daily' },
    })
    useGoals.getState().advanceReminder(id)
    const g = useGoals.getState().goals[0]
    expect(g.reminder).not.toBeNull()
    expect(new Date(g.reminder.nextAt).getTime()).toBeGreaterThan(now.getTime())
  })

  it('advanceReminder supprime le rappel one-shot', () => {
    const id = useGoals.getState().addGoal({
      title: 'One shot',
      reminder: { datetime: '2026-09-20T09:00:00.000Z', recurrence: 'none' },
    })
    useGoals.getState().advanceReminder(id)
    expect(useGoals.getState().goals[0].reminder).toBeNull()
  })

  it('advanceToFuture(e) avance depuis une date passée', () => {
    const next = advanceToFuture(
      new Date('2026-09-01T09:00:00Z'),
      'weekly',
      new Date('2026-09-20T09:00:00Z'),
    )
    expect(next.toISOString()).toBe('2026-09-22T09:00:00.000Z')
  })
})

describe('facilitateurs de rappels', () => {
  function withReminder(nextAt, extra = {}) {
    return makeGoal({
      title: `R ${nextAt}`,
      status: 'todo',
      reminder: {
        datetime: nextAt,
        recurrence: 'none',
        nextAt,
      },
      ...extra,
    })
  }

  it('dueReminders ne retourne que les rappels échus et actifs', () => {
    const due = '2020-01-01T09:00:00.000Z'
    const later = '2099-01-01T09:00:00.000Z'
    const goals = [
      withReminder(due),
      withReminder(due, { status: 'done' }),
      withReminder(later),
      makeGoal({ title: 'sans rappel' }),
    ]
    const res = dueReminders(goals)
    expect(res).toHaveLength(1)
    expect(res[0].title).toBe(`R ${due}`)
  })

  it('upcomingReminders trie par prochaine échéance', () => {
    const goals = [
      withReminder('2099-03-01T09:00:00.000Z'),
      withReminder('2099-01-01T09:00:00.000Z'),
      withReminder('2098-01-01T09:00:00.000Z'),
      withReminder('2098-01-01T09:00:00.000Z', { status: 'done' }),
    ]
    const res = upcomingReminders(goals)
    expect(res.map((g) => g.reminder.nextAt)).toEqual([
      '2098-01-01T09:00:00.000Z',
      '2099-01-01T09:00:00.000Z',
      '2099-03-01T09:00:00.000Z',
    ])
  })

  it('upcomingReminders respecte le limite', () => {
    const goals = [
      withReminder('2099-03-01T09:00:00.000Z'),
      withReminder('2099-01-01T09:00:00.000Z'),
    ]
    expect(upcomingReminders(goals, 1)).toHaveLength(1)
  })
})