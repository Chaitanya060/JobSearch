import { SelectField, TextField } from '../../components/forms/Fields.jsx'
import { Button } from '../../components/ui/Button.jsx'

export const EMPTY_FILTERS = {
  q: '',
  location: '',
  workMode: '',
  employmentType: '',
  source: '',
  sort: 'newest',
}

export function JobFilters({ filters, onChange, onReset }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value })
  return (
    <div className="space-y-4">
      <TextField label="Location" placeholder="City or Remote" value={filters.location} onChange={set('location')} />
      <SelectField label="Work mode" value={filters.workMode} onChange={set('workMode')}>
        <option value="">Any</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="onsite">On-site</option>
      </SelectField>
      <SelectField label="Employment type" value={filters.employmentType} onChange={set('employmentType')}>
        <option value="">Any</option>
        <option value="full-time">Full-time</option>
        <option value="internship">Internship</option>
        <option value="contract">Contract</option>
      </SelectField>
      <SelectField label="Source" value={filters.source} onChange={set('source')}>
        <option value="">All sources</option>
        <option value="himalayas">Himalayas</option>
        <option value="remoteok">Remote OK</option>
        <option value="greenhouse">Greenhouse</option>
        <option value="lever">Lever</option>
        <option value="ashby">Ashby</option>
      </SelectField>
      <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
