import { Inbox, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import { cn } from '../../utils/cn.js'

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-muted', className)} aria-hidden />
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 py-12 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted" aria-hidden />
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface px-6 py-12 text-center"
    >
      <AlertTriangle className="mb-3 h-10 w-10 text-warning" aria-hidden />
      <h3 className="text-base font-semibold text-text">Couldn’t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} />
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex gap-3">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
