import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { ErrorState } from '../../components/data-display/States.jsx'

function FullPage({ children }) {
  return <div className="flex min-h-dvh items-center justify-center p-8">{children}</div>
}

export function ProtectedRoute() {
  const { user, loading, mockMode, account, reloadAccount } = useAuth()
  const location = useLocation()

  if (loading) return <FullPage><span className="text-muted">Loading…</span></FullPage>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  // Real mode: decide onboarding vs. app from the Worker's account status.
  if (!mockMode) {
    if (account.error) {
      return (
        <FullPage>
          <div className="w-full max-w-md">
            <ErrorState message={account.error} onRetry={reloadAccount} />
          </div>
        </FullPage>
      )
    }
    if (account.loading || account.completed === null) {
      return <FullPage><span className="text-muted">Loading your account…</span></FullPage>
    }
    if (account.completed === false) return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <FullPage><span className="text-muted">Loading…</span></FullPage>
  if (!user) return <Navigate to="/login" replace />
  // Hiding the route is not security — the backend must also enforce admin (guide §15).
  if (!isAdmin) return <Navigate to="/app" replace />
  return <Outlet />
}
