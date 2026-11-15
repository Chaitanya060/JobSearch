import { Link } from 'react-router-dom'
import { Search, Bookmark, ClipboardList, Sparkles, ArrowRight } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { MetricCard } from '../../components/data-display/MetricCard.jsx'
import { JobCard } from '../../components/data-display/JobCard.jsx'
import { StatusBadge } from '../../components/data-display/Badges.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState, JobCardSkeleton, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/motion/Motion.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { formatDate } from '../../utils/format.js'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const recs = useAsync(() => api.getRecommendedJobs(), [])
  const apps = useAsync(() => api.getApplications(), [])
  const saved = useAsync(() => api.getSavedJobs(), [])

  const firstName = (user?.displayName || 'there').split(' ')[0]

  return (
    <PageTransition>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Here’s what needs your attention today."
        actions={
          <Button as={Link} to="/app/jobs">
            <Search className="h-4 w-4" /> Find jobs
          </Button>
        }
      />

      {/* Summary cards — honest zero/empty states, no fabricated counts. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Sparkles} label="Matching jobs" value={recs.data?.length ?? 0} hint="Based on your profile" />
        <MetricCard icon={Bookmark} label="Saved jobs" value={saved.data?.length ?? 0} />
        <MetricCard icon={ClipboardList} label="Applications" value={apps.data?.length ?? 0} />
        <MetricCard
          icon={ClipboardList}
          label="In interview"
          value={apps.data?.filter((a) => a.status === 'interview').length ?? 0}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Recommended */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-text">Recommended for you</h2>
            <Link to="/app/recommendations" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recs.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : recs.data?.length ? (
            <StaggerContainer className="space-y-3">
              {recs.data.slice(0, 3).map((job) => (
                <StaggerItem key={job.id}>
                  <JobCard job={job} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No recommendations yet"
              message="Add skills and preferences to get personalized matches."
              action={
                <Button as={Link} to="/app/preferences" size="sm" variant="outline">
                  Update preferences
                </Button>
              }
            />
          )}
        </section>

        {/* Application activity */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-text">Recent applications</h2>
            <Link to="/app/applications" className="text-sm text-primary hover:underline">
              Tracker
            </Link>
          </div>
          <Card className="divide-y divide-border">
            {apps.loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : apps.data?.length ? (
              apps.data.slice(0, 5).map((a) => (
                <Link key={a.id} to={`/app/applications/${a.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{a.job?.title || 'Job'}</p>
                    <p className="truncate text-xs text-muted">
                      {a.job?.companyName} · {formatDate(a.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))
            ) : (
              <div className="p-4">
                <p className="text-sm text-muted">No applications tracked yet.</p>
              </div>
            )}
          </Card>

          {/* Getting-started tips (honest, static guidance — not fabricated activity) */}
          <Card className="mt-4 p-4">
            <h3 className="text-sm font-semibold text-text">Get more relevant matches</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Add your skills and target roles in{' '}
                <Link to="/app/preferences" className="text-primary hover:underline">preferences</Link>.
              </li>
              <li className="flex items-start gap-2">
                <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Save jobs you like to compare them later.
              </li>
              <li className="flex items-start gap-2">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Track an application the moment you apply.
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </PageTransition>
  )
}
