import { Activity, Database, AlertTriangle, Briefcase } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { MetricCard } from '../../components/data-display/MetricCard.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'

export default function AdminSystemHealth() {
  const { data, loading, error, reload } = useAsync(() => api.getSystemHealth(), [])
  if (error) return <ErrorState onRetry={reload} />

  return (
    <PageTransition>
      <PageHeader title="System health" description="Platform reliability metrics." />
      {loading || !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard icon={Briefcase} label="Active jobs" value={data.activeJobs} />
            <MetricCard icon={Database} label="Enabled sources" value={data.enabledSources} />
            <MetricCard icon={AlertTriangle} label="Failed runs" value={data.failedRuns} />
            <MetricCard icon={Activity} label="Total users" value={data.totalUsers} />
          </div>
          <Card className="mt-6 p-5 text-sm text-muted">
            Collection scheduling, Worker quotas and R2 usage will surface here once the backend and
            Cloudflare dashboards are connected.
          </Card>
        </>
      )}
    </PageTransition>
  )
}
