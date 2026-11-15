import { cn } from '../../utils/cn.js'

const variants = {
  // Default: raised surface with a subtle shadow (spec §1 — varied elevations).
  raised: 'border border-border bg-surface shadow-[var(--shadow-sm)]',
  flat: 'border border-border bg-surface',
  glass: 'glass',
}

export function Card({ className, as: Comp = 'div', variant = 'raised', ...props }) {
  return (
    <Comp
      className={cn('rounded-[var(--radius-card)]', variants[variant], className)}
      {...props}
    />
  )
}
