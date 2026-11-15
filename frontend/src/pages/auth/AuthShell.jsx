import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '../../components/ui/Logo.jsx'
import { ThemeToggle } from '../../components/navigation/ThemeToggle.jsx'
import { FadeIn, AmbientGradient } from '../../components/motion/Motion.jsx'

const POINTS = [
  'Roles from multiple sources in one place',
  'Transparent profile-match scoring',
  'Track every application from saved to offer',
]

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-surface-2 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <AmbientGradient />
        <div className="relative z-10">
          <Logo />
        </div>
        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-text">
            A calmer command center for a smarter job search.
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-muted">
          JobPilot aggregates listings from external sources. It does not employ users.
        </p>
      </aside>

      {/* Form side */}
      <div className="flex min-h-dvh flex-col bg-bg">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <span className="lg:invisible">
            <Logo />
          </span>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <FadeIn className="w-full max-w-sm">
            <div className="glass rounded-2xl p-6">
              <h1 className="text-xl font-semibold text-text">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>
            {footer && <p className="mt-4 text-center text-sm text-muted">{footer}</p>}
          </FadeIn>
        </main>
      </div>
    </div>
  )
}

// Google "G" button — no real OAuth in the scaffold.
export function GoogleButton({ onClick, label = 'Continue with Google' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-medium text-text hover:bg-surface-2"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
      {label}
    </button>
  )
}

export function Divider({ label }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export { Link }
