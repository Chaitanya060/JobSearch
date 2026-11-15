import {
  Bookmark,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  ClipboardCheck,
  Users,
  XCircle,
  Award,
  Ban,
} from 'lucide-react'
import { cn } from '../../utils/cn.js'

const toneClasses = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  muted: 'bg-surface-2 text-muted',
  primary: 'bg-primary/10 text-primary',
}

export function Badge({ tone = 'muted', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', toneClasses[tone], className)}>
      {children}
    </span>
  )
}

export function SkillChip({ children, matched, missing }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs',
        matched && 'bg-success/10 text-success',
        missing && 'bg-surface-2 text-muted line-through decoration-muted/50',
        !matched && !missing && 'bg-surface-2 text-text',
      )}
    >
      {children}
    </span>
  )
}

export function SourceBadge({ source }) {
  if (!source) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
      via {source.name}
    </span>
  )
}

// Status conveyed by icon + text + colour (never colour alone — a11y §20).
const STATUS = {
  saved: { label: 'Saved', tone: 'muted', icon: Bookmark },
  prepared: { label: 'Prepared', tone: 'info', icon: FileText },
  applied: { label: 'Applied', tone: 'primary', icon: Send },
  assessment: { label: 'Assessment', tone: 'warning', icon: ClipboardCheck },
  interview: { label: 'Interview', tone: 'info', icon: Users },
  rejected: { label: 'Rejected', tone: 'error', icon: XCircle },
  offer: { label: 'Offer', tone: 'success', icon: Award },
  withdrawn: { label: 'Withdrawn', tone: 'muted', icon: Ban },
  active: { label: 'Active', tone: 'success', icon: CheckCircle2 },
  possibly_expired: { label: 'Possibly expired', tone: 'warning', icon: Clock },
  closed: { label: 'Closed', tone: 'muted', icon: Ban },
  expired: { label: 'Expired', tone: 'muted', icon: Ban },
}

export const APPLICATION_STATUSES = [
  'saved',
  'prepared',
  'applied',
  'assessment',
  'interview',
  'rejected',
  'offer',
  'withdrawn',
]

export function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.saved
  const Icon = s.icon
  return (
    <Badge tone={s.tone}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {s.label}
    </Badge>
  )
}
