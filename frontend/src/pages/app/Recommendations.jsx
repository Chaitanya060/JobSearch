import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { JobCard } from '../../components/data-display/JobCard.jsx'
import { SkillChip } from '../../components/data-display/Badges.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { EmptyState, ErrorState, JobCardSkeleton } from '../../components/data-display/States.jsx'
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/motion/Motion.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'

export default function Recommendations() {
  const { data, loading, error, reload } = useAsync(() => api.getRecommendedJobs(), [])
  const toast = useToast()

  const onToggleSave = async (job) => {
    try {
      job.saved ? await api.unsaveJob(job.id) : await api.saveJob(job.id)
      toast(job.saved ? 'Removed from saved' : 'Saved', { type: 'success' })
      reload()
    } catch {
      toast('Could not update saved jobs', { type: 'error' })
    }
  }

  return (
    <PageTransition>
      <PageHeader
        title="Recommended jobs"
        description="Ranked by transparent profile compatibility — not a hiring probability."
        actions={
          <Button as={Link} to="/app/preferences" variant="outline" size="sm">
            Tune preferences
          </Button>
        }
      />

      {error ? (
        <ErrorState onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={Sparkles}
          title="No strong matches yet"
          message="Add more skills and preferred roles so we can recommend better."
          action={
            <Button as={Link} to="/app/preferences" size="sm">
              Update preferences
            </Button>
          }
        />
      ) : (
        <StaggerContainer className="space-y-4">
          {data.map((job) => (
            <StaggerItem key={job.id}>
              <div className="space-y-2">
                <JobCard job={job} onToggleSave={onToggleSave} />
                <Card className="px-4 py-3">
                  <p className="text-xs font-medium text-text">Why recommended</p>
                  <p className="mt-1 text-xs text-muted">{job.match.reasons.join(' · ')}</p>
                  {job.match.missingSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted">Add:</span>
                      {job.match.missingSkills.slice(0, 5).map((s) => (
                        <SkillChip key={s} missing>
                          {s}
                        </SkillChip>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </PageTransition>
  )
}
