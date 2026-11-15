import { useState } from 'react'
import { X } from 'lucide-react'
import { Label } from './Fields.jsx'

// Removable chips/tags for skills & roles (UI spec §9 step 3).
export function SkillInput({ label, value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim()
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v])
    setDraft('')
  }
  const remove = (skill) => onChange(value.filter((s) => s !== skill))

  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-sm text-text"
          >
            {skill}
            <button
              type="button"
              onClick={() => remove(skill)}
              className="rounded text-muted hover:text-error"
              aria-label={`Remove ${skill}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            } else if (e.key === 'Backspace' && !draft && value.length) {
              remove(value[value.length - 1])
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
        />
      </div>
    </div>
  )
}
