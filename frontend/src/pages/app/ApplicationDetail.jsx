import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField, TextArea } from '../../components/forms/Fields.jsx'
import { StatusBadge, APPLICATION_STATUSES } from '../../components/data-display/Badges.jsx'
import { ApplicationTimeline } from '../../components/data-display/ApplicationTimeline.jsx'
import { ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'

export default function ApplicationDetail() {
  const { applicationId } = useParams()
  const { data, loading, error, reload } = useAsync(() => api.getApplication(applicationId), [applicationId])
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  if (error || !data) return <ErrorState message="Application not found." onRetry={reload} />

  const curStatus = dirty ? status : data.status
  const curNotes = dirty ? notes : data.notes || ''

  const save = async () => {
    setSaving(true)
    try {
      await api.updateApplication(data.id, { status: curStatus, notes: curNotes })
      toast('Application updated', { type: 'success' })
      setDirty(false)
      reload()
    } catch {
      toast('Could not save', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <Link to="/app/applications" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" /> Back to tracker
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold text-text">{data.job?.title}</h1>
                <p className="text-muted">{data.job?.companyName}</p>
              </div>
              <StatusBadge status={data.status} />
            </div>
            {data.job && (
              <Button as={Link} to={`/app/jobs/${data.jobId}`} variant="outline" size="sm" className="mt-4">
                View job <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-text">Update status</h2>
            <div className="space-y-4">
              <SelectField
                label="Status"
                value={curStatus}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setNotes(curNotes)
                  setDirty(true)
                }}
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </SelectField>
              <TextArea
                label="Private notes"
                value={curNotes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setStatus(curStatus)
                  setDirty(true)
                }}
                placeholder="Interview prep, recruiter name, next steps…"
              />
              <div className="flex justify-end">
                <Button onClick={save} loading={saving} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5 lg:sticky lg:top-20 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold text-text">History</h2>
          <ApplicationTimeline events={data.events} />
        </Card>
      </div>
    </PageTransition>
  )
}
