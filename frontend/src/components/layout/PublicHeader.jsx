import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from '../ui/Logo.jsx'
import { Button } from '../ui/Button.jsx'
import { ThemeToggle } from '../navigation/ThemeToggle.jsx'

const LINKS = [
  { to: '/jobs', label: 'Find jobs' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/#features', label: 'Features' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a key={l.to} href={l.to} className="text-sm text-muted hover:text-text">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button as={Link} to="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button as={Link} to="/register" size="sm">
            Get started
          </Button>
        </div>
        <button className="rounded-lg p-2 text-text md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm text-text hover:bg-surface-2">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex items-center justify-between">
            <ThemeToggle />
            <div className="flex gap-2">
              <Button as={Link} to="/login" variant="outline" size="sm">
                Sign in
              </Button>
              <Button as={Link} to="/register" size="sm">
                Get started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
