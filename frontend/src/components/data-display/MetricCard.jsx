import { Card } from '../ui/Card.jsx'
import { CountUpOnce } from '../motion/Motion.jsx'

export function MetricCard({ icon: Icon, label, value, hint, countUp = true }) {
  return (
    <Card className="p-4 transition-shadow duration-200 hover:shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="tabular mt-3 text-3xl font-semibold tracking-tight text-text">
        {countUp && typeof value === 'number' ? <CountUpOnce value={value} /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}
