import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { TextField, SelectField } from '../../components/forms/Fields.jsx'
import { ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'
import { initials } from '../../utils/format.js'

function completeness(f) {
  const fields = [f.fullName, f.phone, f.educationLevel, f.degree, f.graduationYear]
  const filled = fields.filter((v) => v != null && String(v).trim() !== '').length
  return Math.round((filled / fields.length) * 100)
}

export default function Profile() {
  const { data, loading, error, reload } = useAsync(() => api.getMe(), [])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  if (loading || !form) {
    if (error) return <ErrorState onRetry={reload} />
    return (
      <Card className="space-y-3 p-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateMe({
        fullName: form.fullName,
        phone: form.phone,
        educationLevel: form.educationLevel,
        degree: form.degree,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
        experienceYears: Number(form.experienceYears) || 0,
      })
      toast('Profile saved', { type: 'success' })
      reload()
    } catch {
      toast('Could not save profile', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const pct = completeness(form)

  return (
    <PageTransition>
      <PageHeader title="Profile" description="Your details help us match jobs and prepare applications." />
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Summary rail */}
        <Card className="h-fit p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
              {initials(form.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-text">{form.fullName || 'Your name'}</p>
              <p className="truncate text-sm text-muted">{form.email || 'Not provided'}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Profile completeness</span>
              <span className="tabular font-medium text-text">{pct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">Based only on fields you’ve actually filled in.</p>
          </div>
        </Card>

        {/* Editable sections */}
        <Card as="form" onSubmit={save} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Full name" value={form.fullName || ''} onChange={set('fullName')} />
            <TextField label="Email" value={form.email || ''} disabled hint="Managed by your sign-in provider." />
            <TextField label="Phone (optional)" value={form.phone || ''} onChange={set('phone')} />
            <SelectField label="Highest education" value={form.educationLevel || ''} onChange={set('educationLevel')}>
              <option value="">Select…</option>
              <option>High school</option>
              <option>Diploma</option>
              <option>Bachelor's</option>
              <option>Master's</option>
              <option>PhD</option>
            </SelectField>
            <TextField label="Degree / discipline" value={form.degree || ''} onChange={set('degree')} />
            <TextField label="Graduation year" type="number" value={form.graduationYear || ''} onChange={set('graduationYear')} />
            <TextField label="Years of experience" type="number" step="0.5" value={form.experienceYears ?? 0} onChange={set('experienceYears')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setForm(data)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  )
}
