import { beforeEach, describe, expect, it } from 'vitest'
import {
  goalProgress,
  normalizeGoal,
  useGoals,
} from './goalsStore'

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
    })
    expect(typeof g.id).toBe('string')
    expect(g.title).toBe('Sans titre')
    expect(g.category).toBe('short')
    expect(g.status).toBe('todo')
    expect(g.subtasks).toHaveLength(1)
    expect(g.subtasks[0].done).toBe(true)
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