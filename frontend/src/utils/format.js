// Display helpers. Keep formatting in one place so cards/detail/tracker agree.

export function relativeDate(iso) {
  if (!iso) return 'Date unknown'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Date unknown'
  const days = Math.round((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

// Salary when the source actually provides it. "Salary not provided" must be
// distinct from a zero salary (UI spec §11).
export function formatSalary(min, max, currency = 'INR') {
  if (min == null && max == null) return 'Salary not provided'
  const fmt = (n) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(n)
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`
  return fmt(min ?? max)
}

export function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?'
  )
}
