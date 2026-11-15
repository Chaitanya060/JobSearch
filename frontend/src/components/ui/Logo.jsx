import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { cn } from '../../utils/cn.js'

export function Logo({ to = '/', className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2 font-semibold text-text', className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-fg">
        <Compass className="h-4 w-4" aria-hidden />
      </span>
      <span>JobPilot</span>
    </Link>
  )
}
