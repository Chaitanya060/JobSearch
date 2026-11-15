import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const fieldBase =
  'w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors'

export function Label({ children, htmlFor, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-sm font-medium text-text', className)}>
      {children}
    </label>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="mt-1.5 text-sm text-error">
      {children}
    </p>
  )
}

export function TextField({ label, error, hint, id, className, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <input id={fieldId} className={cn(fieldBase, error && 'border-error')} aria-invalid={!!error} {...props} />
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      <FormError>{error}</FormError>
    </div>
  )
}

export function PasswordField({ label, error, hint, id, className, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  const [show, setShow] = useState(false)
  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <div className="relative">
        <input
          id={fieldId}
          type={show ? 'text' : 'password'}
          className={cn(fieldBase, 'pr-10', error && 'border-error')}
          aria-invalid={!!error}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      <FormError>{error}</FormError>
    </div>
  )
}

export function SelectField({ label, error, id, className, children, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <select id={fieldId} className={cn(fieldBase, 'cursor-pointer', error && 'border-error')} {...props}>
        {children}
      </select>
      <FormError>{error}</FormError>
    </div>
  )
}

export function TextArea({ label, error, id, className, rows = 4, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <textarea
        id={fieldId}
        rows={rows}
        className={cn(fieldBase, 'h-auto py-2 resize-y', error && 'border-error')}
        {...props}
      />
      <FormError>{error}</FormError>
    </div>
  )
}
