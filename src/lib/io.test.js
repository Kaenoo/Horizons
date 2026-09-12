import { describe, expect, it } from 'vitest'
import { buildExportPayload, EXPORT_VERSION, parseImportData } from './io'

function validGoal(overrides = {}) {
  return {
    id: 'g1',
    title: 'Objectif',
    category: 'short',
    status: 'todo',
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
    dueDate: null,
    subtasks: [{ id: 's1', title: 'Sous-tâche', done: false }],
    ...overrides,
  }
}

describe('buildExportPayload', () => {
  it('encode app, version et goals', () => {
    const payload = buildExportPayload([validGoal()])
    expect(payload.app).toBe('horizons')
    expect(payload.version).toBe(EXPORT_VERSION)
    expect(payload.exportedAt).toBeTruthy()
    expect(payload.goals).toHaveLength(1)
  })

  it('retire les objectifs invalides', () => {
    const payload = buildExportPayload([validGoal(), null, 'x'])
    expect(payload.goals).toHaveLength(1)
  })
})

describe('parseImportData', () => {
  it('accepte un payload d’export Horizons', () => {
    const goals = parseImportData(
      JSON.stringify({ app: 'horizons', version: 1, exportedAt: 'x', goals: [validGoal()] }),
    )
    expect(goals).toHaveLength(1)
    expect(goals[0].id).toBe('g1')
  })

  it('accepte un simple tableau d’objectifs', () => {
    const goals = parseImportData(JSON.stringify([validGoal({ id: 'raw' })]))
    expect(goals[0].id).toBe('raw')
  })

  it('rejette un JSON invalide', () => {
    expect(() => parseImportData('{pas du json')).toThrow('pas un JSON valide')
  })

  it('rejette un objet sans objectifs', () => {
    expect(() => parseImportData(JSON.stringify({ hello: 'world' }))).toThrow(
      'Aucun objectif trouvé',
    )
  })

  it('rejette une liste vide ou sans objectif exploitable', () => {
    expect(() => parseImportData(JSON.stringify([]))).toThrow('aucun objectif exploitable')
    expect(() => parseImportData(JSON.stringify(['nope', 42]))).toThrow('aucun objectif exploitable')
  })

  it('normalise les objectifs importés', () => {
    const goals = parseImportData(
      JSON.stringify([{ title: 'Importé', category: 'long', lien: 'ignoré' }]),
    )
    expect(goals[0].title).toBe('Importé')
    expect(goals[0].category).toBe('long')
    expect(goals[0].status).toBe('todo')
    expect(goals[0].subtasks).toEqual([])
  })
})