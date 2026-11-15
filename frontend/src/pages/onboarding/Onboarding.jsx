import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { api } from '../../services/api.js'
import { Logo } from '../../components/ui/Logo.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ThemeToggle } from '../../components/navigation/ThemeToggle.jsx'

// Placeholder for the 7-step profile setup (Milestone 5). The guard logic is
// already in place: new real-Firebase users are routed here until onboarding is
// completed; completed users and mock-mode users go straight to the app.
export default function Onboarding() {
  const { user, loading, mockMode, account, signOut, reloadAccount } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const continueToApp = async () => {
    setBusy(true)
    try {
      await api.completeOnboarding()
      await reloadAccount()
      navigate('/app')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="flex min-h-dvh items-center justify-center text-muted">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (mockMode || account.completed === true) return <Navigate to="/app" replace />

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="glass w-full max-w-md rounded-2xl p-6 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-semibold text-text">Let’s set up your profile</h1>
          <p className="mt-2 text-sm text-muted">
            The guided 7-step setup is coming next. Your account{user.email ? ` (${user.email})` : ''} is
            signed in — for now you can continue straight to your dashboard.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={continueToApp} loading={busy}>
              Continue to dashboard
            </Button>
            <Button variant="outline" onClick={async () => { await signOut(); navigate('/') }}>
              Sign out
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
