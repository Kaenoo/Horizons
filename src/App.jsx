import { useState } from 'react'
import { useGoals } from './store/goalsStore'
import BottomNav from './components/layout/BottomNav'
import GoalForm from './components/goals/GoalForm'
import Home from './pages/Home'
import Horizons from './pages/Horizons'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

const PAGES = {
  home: Home,
  horizons: Horizons,
  stats: Stats,
  settings: Settings,
}

export default function App() {
  const view = useGoals((s) => s.activeView)
  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  const Page = PAGES[view] ?? Home

  const openForm = (goal) => {
    setEditingGoal(goal ?? null)
    setFormOpen(true)
  }
  const closeForm = () => setFormOpen(false)

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-canvas text-ink">
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <Page key={view} onOpenForm={openForm} />
      </main>

      <BottomNav />

      {formOpen && (
        <GoalForm
          key={editingGoal?.id ?? 'new'}
          goal={editingGoal}
          onClose={closeForm}
        />
      )}
    </div>
  )
}