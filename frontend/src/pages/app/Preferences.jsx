import { useEffect, useState } from 'react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { TextField } from '../../components/forms/Fields.jsx'
import { SkillInput } from '../../components/forms/SkillInput.jsx'
import { ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'
import { cn } from '../../utils/cn.js'

const WORK_MODES = ['remote', 'hybrid', 'onsite']
const EMPLOYMENT = ['full-time', 'internship', 'contract']

function TogglePills({ options, value, onChange }) {
  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          aria-pressed={value.includes(opt)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm capitalize transition-colors',
            value.includes(opt)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted hover:text-text',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function Preferences() {
  const { data, loading, error, reload } = useAsync(() => api.getPreferences(), [])
  const [p, setP] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (data) setP(data)
  }, [data])

  if (loading || !p) {
    if (error) return <ErrorState onRetry={reload} />
    return (
      <Card className="space-y-3 p-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await api.updatePreferences(p)
      toast('Preferences saved', { type: 'success' })
      reload()
    } catch {
      toast('Could not save preferences', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Preferences" description="These influence your recommendations — not employer selection." />
      <div className="max-w-2xl space-y-4">
        <Card className="space-y-4 p-5">
          <SkillInput label="Preferred roles" value={p.preferredRoles} onChange={(v) => set('preferredRoles', v)} />
          <SkillInput label="Skills" value={p.preferredSkills} onChange={(v) => set('preferredSkills', v)} />
          <SkillInput label="Preferred locations" value={p.preferredLocations} onChange={(v) => set('preferredLocations', v)} />
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <p className="mb-2 text-sm font-medium text-text">Work mode</p>
            <TogglePills options={WORK_MODES} value={p.workModes} onChange={(v) => set('workModes', v)} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-text">Employment type</p>
            <TogglePills options={EMPLOYMENT} value={p.employmentTypes} onChange={(v) => set('employmentTypes', v)} />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <p className="text-sm font-medium text-text">Salary range (optional)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Minimum" type="number" value={p.minSalary ?? ''} onChange={(e) => set('minSalary', e.target.value ? Number(e.target.value) : null)} />
            <TextField label="Maximum" type="number" value={p.maxSalary ?? ''} onChange={(e) => set('maxSalary', e.target.value ? Number(e.target.value) : null)} />
            <TextField label="Currency" value={p.salaryCurrency} onChange={(e) => set('salaryCurrency', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={p.includeInternships}
              onChange={(e) => set('includeInternships', e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Include internships in recommendations
          </label>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>
            Save preferences
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
