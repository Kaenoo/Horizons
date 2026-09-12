import GoalCard from './GoalCard'

export default function GoalList({ goals = [], onEdit }) {
  if (!goals.length) return null

  const sorted = [...goals].sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate) : Infinity
    const bd = b.dueDate ? new Date(b.dueDate) : Infinity
    if (a.status === 'done' && b.status !== 'done') return 1
    if (b.status === 'done' && a.status !== 'done') return -1
    if (ad !== bd) return ad > bd ? 1 : -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onEdit={onEdit} />
      ))}
    </div>
  )
}