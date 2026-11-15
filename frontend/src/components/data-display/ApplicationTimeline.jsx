import { StatusBadge } from './Badges.jsx'
import { formatDate } from '../../utils/format.js'

export function ApplicationTimeline({ events = [] }) {
  if (!events.length) return <p className="text-sm text-muted">No history yet.</p>
  return (
    <ol className="relative ml-2 border-l border-border">
      {[...events].reverse().map((e) => (
        <li key={e.id} className="mb-4 ml-4 last:mb-0">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
          <div className="flex items-center gap-2">
            <StatusBadge status={e.newStatus} />
            <time className="text-xs text-muted">{formatDate(e.createdAt)}</time>
          </div>
          {e.eventNote && <p className="mt-1 text-sm text-muted">{e.eventNote}</p>}
        </li>
      ))}
    </ol>
  )
}
