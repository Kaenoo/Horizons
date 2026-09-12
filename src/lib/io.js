import { normalizeGoal } from '../store/goalsStore'
import { todayISO } from './format'

export const EXPORT_VERSION = 1

export function buildExportPayload(goals) {
  return {
    app: 'horizons',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    goals: goals.map((g) => normalizeGoal(g)).filter(Boolean),
  }
}

export function exportGoalsToFile(goals) {
  const payload = buildExportPayload(goals)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `horizons-export-${todayISO()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function readImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'))
    reader.onload = () => {
      try {
        resolve(parseImportData(String(reader.result)))
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsText(file)
  })
}

export function parseImportData(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Le fichier n’est pas un JSON valide.')
  }

  const source =
    Array.isArray(data) ? data : data && Array.isArray(data.goals) ? data.goals : null

  if (!source) {
    throw new Error('Aucun objectif trouvé dans ce fichier.')
  }

  const goals = source.map(normalizeGoal).filter(Boolean)
  if (goals.length === 0) {
    throw new Error('Ce fichier ne contient aucun objectif exploitable.')
  }

  return goals
}