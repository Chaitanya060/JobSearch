import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { JobCard } from '../../components/data-display/JobCard.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState, ErrorState, JobCardSkeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'
import { useConfirm } from '../../components/feedback/ConfirmProvider.jsx'

export default function SavedJobs() {
  const { data, loading, error, reload } = useAsync(() => api.getSavedJobs(), [])
  const toast = useToast()
  const confirm = useConfirm()

  const onToggleSave = async (job) => {
    const ok = await confirm({
      title: 'Remove saved job?',
      message: `Remove “${job.title}” from your saved list?`,
      confirmLabel: 'Remove',
    })
    if (!ok) return
    try {
      await api.unsaveJob(job.id)
      toast('Removed from saved', { type: 'success' })
      reload()
    } catch {
      toast('Could not remove', { type: 'error' })
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Saved jobs" description="Jobs you’ve bookmarked to revisit." />
      {error ? (
        <ErrorState onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs"
          message="Save jobs from search or recommendations to find them here."
          action={
            <Button as={Link} to="/app/jobs" size="sm">
              Browse jobs
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((job) => (
            <JobCard key={job.id} job={{ ...job, saved: true }} onToggleSave={onToggleSave} />
          ))}
        </div>
      )}
    </PageTransition>
  )
}
