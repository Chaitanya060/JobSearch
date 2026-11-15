import { Briefcase, Database, AlertTriangle, Trash2, Plus, Users } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { MetricCard } from '../../components/data-display/MetricCard.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { formatDate } from '../../utils/format.js'

export default function AdminOverview() {
  const { data, loading, error, reload } = useAsync(() => api.getSystemHealth(), [])
  if (error) return <ErrorState onRetry={reload} />

  return (
    <PageTransition>
      <PageHeader title="Admin overview" description="System reliability at a glance." />
      {loading || !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <MetricCard icon={Briefcase} label="Active jobs" value={data.activeJobs} />
            <MetricCard icon={Plus} label="Added recently" value={data.jobsAddedRecent} />
            <MetricCard icon={Database} label="Enabled sources" value={data.enabledSources} />
            <MetricCard icon={AlertTriangle} label="Failed runs" value={data.failedRuns} />
            <MetricCard icon={Trash2} label="Expired (cleanup)" value={data.expiredAwaitingCleanup} />
            <MetricCard icon={Users} label="Total users" value={data.totalUsers} />
          </div>
          <Card className="mt-6 p-5">
            <h2 className="mb-3 text-sm font-semibold text-text">Recent errors</h2>
            {data.recentErrors?.length ? (
              <ul className="space-y-2 text-sm">
                {data.recentErrors.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-muted">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-text">{e.message}</span>
                    <span className="ml-auto text-xs">{formatDate(e.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No recent errors.</p>
            )}
          </Card>
        </>
      )}
    </PageTransition>
  )
}
