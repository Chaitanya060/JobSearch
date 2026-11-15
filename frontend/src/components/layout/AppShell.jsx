import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, Search, LogOut, ChevronLeft } from 'lucide-react'
import { Logo } from '../ui/Logo.jsx'
import { ThemeToggle } from '../navigation/ThemeToggle.jsx'
import { Drawer } from '../feedback/Overlay.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { initials } from '../../utils/format.js'
import { cn } from '../../utils/cn.js'

function NavList({ items, onNavigate, collapsed }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary'
                : 'text-muted hover:bg-surface-2 hover:text-text',
            )
          }
          title={collapsed ? label : undefined}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-text"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials(user?.displayName)}
      </button>
      {open && (
        <div className="glass absolute right-0 mt-2 w-48 rounded-xl p-1">
          <p className="truncate px-3 py-2 text-xs text-muted">{user?.email}</p>
          <Link to="/app/profile" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-text hover:bg-surface-2">
            Profile
          </Link>
          <Link to="/app/settings" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-text hover:bg-surface-2">
            Settings
          </Link>
          <button
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-error hover:bg-surface-2"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function AppShell({ nav, mobilePrimary, title = 'JobPilot' }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('jobpilot-sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem('jobpilot-sidebar', next ? 'collapsed' : 'expanded')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-16 items-center justify-between px-3">
          {collapsed ? <Logo to="/app" className="[&>span:last-child]:hidden" /> : <Logo to="/app" />}
          <button onClick={toggleCollapsed} className="rounded-md p-1.5 text-muted hover:text-text" aria-label="Toggle sidebar">
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <NavList items={nav} collapsed={collapsed} />
        </div>
      </aside>

      {/* Main column */}
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <header
          className={cn(
            'sticky top-0 z-10 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl backdrop-saturate-150 transition-colors sm:px-6',
            scrolled ? 'border-border bg-[var(--glass-bg-strong)] shadow-[var(--shadow-sm)]' : 'border-transparent bg-[var(--glass-bg)]',
          )}
        >
          <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 text-text lg:hidden" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm font-medium text-muted lg:block">{title}</div>
          <Link
            to="/app/jobs"
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search jobs</span>
          </Link>
          <ThemeToggle />
          <UserMenu />
        </header>

        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        {mobilePrimary && (
          <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface lg:hidden">
            {mobilePrimary.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('flex flex-1 flex-col items-center gap-1 py-2 text-xs', isActive ? 'text-primary' : 'text-muted')
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* Mobile full-nav drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu" side="left">
        <NavList items={nav} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  )
}
