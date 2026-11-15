import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, ExternalLink, MapPin, Briefcase, Clock, CheckCircle2 } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge, SkillChip, SourceBadge, StatusBadge } from '../../components/data-display/Badges.jsx'
import { MatchScore } from '../../components/data-display/MatchScore.jsx'
import { ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { Modal } from '../../components/feedback/Overlay.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'
import { formatSalary, relativeDate, formatDate } from '../../utils/format.js'

const WORK_MODE = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }

export function JobDetailView({ jobId, isPublic = false }) {
  const { data: job, loading, error, reload } = useAsync(() => api.getJob(jobId), [jobId])
  const [saved, setSaved] = useState(null)
  const [prepOpen, setPrepOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  if (error || !job) return <ErrorState message="This job could not be loaded." onRetry={reload} />

  const isSaved = saved ?? job.saved
  const toggleSave = async () => {
    if (isPublic) return navigate('/login')
    try {
      if (isSaved) await api.unsaveJob(job.id)
      else await api.saveJob(job.id)
      setSaved(!isSaved)
      toast(isSaved ? 'Removed from saved' : 'Saved', { type: 'success' })
    } catch {
      toast('Could not update saved jobs', { type: 'error' })
    }
  }

  const prepare = () => (isPublic ? navigate('/login') : setPrepOpen(true))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text sm:text-2xl">{job.title}</h1>
              <p className="mt-1 text-muted">{job.companyName}</p>
            </div>
            {job.match && <MatchScore score={job.match.score} />}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {job.locationText || 'Location unspecified'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> {WORK_MODE[job.workMode] || job.workMode} · {job.employmentType}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Posted {relativeDate(job.postedAt)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <SourceBadge source={job.source} />
            {job.status && job.status !== 'active' && <StatusBadge status={job.status} />}
            <Badge tone="muted">
              {job.experienceMin ?? 0}
              {job.experienceMax != null ? `–${job.experienceMax}` : '+'} yrs
            </Badge>
            <span className="text-sm text-muted">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
          </div>

          <p className="mt-2 text-xs text-muted">
            Collected {formatDate(job.lastSeenAt)} · Availability may have changed on the original source.
          </p>
        </Card>

        {job.match && (
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-text">Why this matches</h2>
            <ul className="mb-4 space-y-1.5 text-sm text-muted">
              {job.match.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> {r}
                </li>
              ))}
            </ul>
            <div className="space-y-3">
              {job.match.matchedSkills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-text">Matched skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.match.matchedSkills.map((s) => (
                      <SkillChip key={s} matched>
                        {s}
                      </SkillChip>
                    ))}
                  </div>
                </div>
              )}
              {job.match.missingSkills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-text">Skills to add</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.match.missingSkills.map((s) => (
                      <SkillChip key={s} missing>
                        {s}
                      </SkillChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-muted">
              Profile match is a compatibility estimate, not a hiring probability.
            </p>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-text">Job description</h2>
          {/* Mock description is plain text; the real API must sanitize provider HTML. */}
          <p className="whitespace-pre-line text-sm leading-relaxed text-text">{job.description}</p>
        </Card>
      </div>

      {/* Action rail */}
      <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <Card className="p-4">
          <Button className="w-full" onClick={prepare}>
            Prepare application
          </Button>
          <Button as="a" href={job.applyUrl} target="_blank" rel="noopener noreferrer" variant="outline" className="mt-2 w-full">
            Apply on employer site <ExternalLink className="h-4 w-4" />
          </Button>
          <button
            onClick={toggleSave}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-muted hover:text-text"
            aria-pressed={isSaved}
          >
            <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
            {isSaved ? 'Saved' : 'Save job'}
          </button>
          <p className="mt-3 text-xs text-muted">
            Assisted Apply: JobPilot prepares your details; you review and submit on the employer’s
            official page.
          </p>
        </Card>
      </div>

      <Modal
        open={prepOpen}
        onClose={() => setPrepOpen(false)}
        title="Assisted application"
        footer={
          <>
            <Button variant="outline" onClick={() => setPrepOpen(false)}>
              Close
            </Button>
            <Button
              as="a"
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPrepOpen(false)}
            >
              Open employer page <ExternalLink className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <p className="mb-3 text-muted">
          Review your checklist, then submit on the employer’s site. JobPilot does not submit on
          your behalf and never fills legal declarations for you.
        </p>
        <ul className="space-y-2 text-sm">
          {['Select a resume', 'Confirm your profile details', 'Tailor your summary to the role', 'Submit on the employer page'].map(
            (step) => (
              <li key={step} className="flex items-center gap-2 text-text">
                <CheckCircle2 className="h-4 w-4 text-muted" aria-hidden /> {step}
              </li>
            ),
          )}
        </ul>
      </Modal>
    </div>
  )
}
