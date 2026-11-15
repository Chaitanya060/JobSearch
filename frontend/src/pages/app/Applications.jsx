import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField } from '../../components/forms/Fields.jsx'
import { StatusBadge, APPLICATION_STATUSES } from '../../components/data-display/Badges.jsx'
import { EmptyState, ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { formatDate } from '../../utils/format.js'

export default function Applications() {
  const { data, loading, error, reload } = useAsync(() => api.getApplications(), [])
  const [filter, setFilter] = useState('')

  const rows = (data || []).filter((a) => !filter || a.status === filter)

  return (
    <PageTransition>
      <PageHeader
        title="Application tracker"
        description="Status updates are manual — only you (or a confirmed integration) change them."
        actions={
          <SelectField value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44" aria-label="Filter by status">
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </SelectField>
        }
      />

      {error ? (
        <ErrorState onRetry={reload} />
      ) : loading ? (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </Card>
      ) : !rows.length ? (
        <EmptyState
          icon={ClipboardList}
          title={filter ? 'Nothing with that status' : 'No applications yet'}
          message={filter ? 'Try a different status filter.' : 'Prepare an application from a job to start tracking it.'}
          action={
            !filter && (
              <Button as={Link} to="/app/jobs" size="sm">
                Find jobs
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Table on desktop, stacked rows on mobile. */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted sm:grid">
            <span>Job</span>
            <span>Updated</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {rows.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/app/applications/${a.id}`}
                  className="flex flex-col gap-2 px-4 py-3 hover:bg-surface-2 sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{a.job?.title || 'Job'}</p>
                    <p className="truncate text-xs text-muted">{a.job?.companyName}</p>
                  </div>
                  <span className="text-xs text-muted">{formatDate(a.updatedAt)}</span>
                  <StatusBadge status={a.status} />
                  <span className="text-sm text-primary">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageTransition>
  )
}
