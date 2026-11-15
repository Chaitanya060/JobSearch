import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Bookmark, MapPin, Briefcase, Clock } from 'lucide-react'
import { Card } from '../ui/Card.jsx'
import { Badge, SourceBadge, StatusBadge } from './Badges.jsx'
import { MatchScore } from './MatchScore.jsx'
import { initials, formatSalary, relativeDate } from '../../utils/format.js'
import { cn } from '../../utils/cn.js'

const WORK_MODE = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' }

export function JobCard({ job, onToggleSave, to }) {
  const detailTo = to || `/app/jobs/${job.id}`
  const saved = job.saved

  return (
    <Card className="p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-md)]">
      <div className="flex gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold text-muted"
          aria-hidden
        >
          {initials(job.companyName)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={detailTo} className="block truncate font-semibold text-text hover:text-primary">
                {job.title}
              </Link>
              <p className="truncate text-sm text-muted">{job.companyName}</p>
            </div>
            {onToggleSave && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleSave(job)}
                aria-pressed={saved}
                aria-label={saved ? 'Unsave job' : 'Save job'}
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  saved ? 'text-primary' : 'text-muted hover:text-text',
                )}
              >
                <Bookmark className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
              </motion.button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {job.locationText || 'Location unspecified'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" aria-hidden />
              {WORK_MODE[job.workMode] || job.workMode || '—'} · {job.employmentType}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Posted {relativeDate(job.postedAt)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(job.skills || []).slice(0, 4).map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
            {job.skills?.length > 4 && <span className="text-xs text-muted">+{job.skills.length - 4}</span>}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SourceBadge source={job.source} />
              {job.status && job.status !== 'active' && <StatusBadge status={job.status} />}
              <span className="text-xs text-muted">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
            </div>
            {job.match && <MatchScore score={job.match.score} size={44} showLabel={false} />}
          </div>
        </div>
      </div>
    </Card>
  )
}
