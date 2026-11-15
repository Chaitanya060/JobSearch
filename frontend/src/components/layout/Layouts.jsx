import { Link, Outlet } from 'react-router-dom'
import { PublicHeader } from './PublicHeader.jsx'
import { AppShell } from './AppShell.jsx'
import { Logo } from '../ui/Logo.jsx'
import { USER_NAV, MOBILE_PRIMARY, ADMIN_NAV } from '../navigation/navItems.js'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <nav className="flex flex-wrap gap-4 text-sm text-muted">
            <Link to="/jobs" className="hover:text-text">Find jobs</Link>
            <Link to="/privacy" className="hover:text-text">Privacy</Link>
            <Link to="/terms" className="hover:text-text">Terms</Link>
            <Link to="/contact" className="hover:text-text">Contact</Link>
          </nav>
          <p className="text-xs text-muted">
            JobPilot aggregates listings from external sources. It does not employ users.
          </p>
        </div>
      </footer>
    </div>
  )
}

export function UserLayout() {
  return <AppShell nav={USER_NAV} mobilePrimary={MOBILE_PRIMARY} title="Workspace" />
}

export function AdminLayout() {
  return <AppShell nav={ADMIN_NAV} title="Admin" />
}
