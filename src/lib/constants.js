export const CATEGORIES = [
  { id: 'short', label: 'Court', hint: 'Moins de 3 mois', color: 'bg-court' },
  { id: 'medium', label: 'Moyen', hint: '3 à 12 mois', color: 'bg-moyen' },
  { id: 'long', label: 'Long', hint: 'Plus d’un an', color: 'bg-long' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export const STATUSES = [
  { id: 'todo', label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'done', label: 'Terminé' },
]

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]))

export const VIEWS = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'horizons', label: 'Horizons', icon: 'layers' },
  { id: 'stats', label: 'Stats', icon: 'chart' },
  { id: 'settings', label: 'Réglages', icon: 'settings' },
]