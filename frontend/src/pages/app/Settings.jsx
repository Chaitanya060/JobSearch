import { useNavigate } from 'react-router-dom'
import { Shield, LogOut, Download, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/Page.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ThemeToggle } from '../../components/navigation/ThemeToggle.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'
import { useConfirm } from '../../components/feedback/ConfirmProvider.jsx'

function Row({ title, description, children }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { user, role, isAdmin, __setRole, signOut } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const deleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete your account?',
      message:
        'This permanently removes your profile, preferences, saved jobs, applications and resumes. This cannot be undone.',
      confirmLabel: 'Delete account',
      danger: true,
    })
    if (!ok) return
    toast('Account deletion is not wired up in this preview.', { type: 'info' })
  }

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Manage your account and appearance." />
      <div className="max-w-2xl space-y-4">
        <Card className="divide-y divide-border px-5">
          <Row title="Signed in as" description={user?.email}>
            <span className="text-sm text-muted">Email / password</span>
          </Row>
          <Row title="Appearance" description="Light, dark or follow your system.">
            <ThemeToggle />
          </Row>
          <Row title="Export your data" description="Download a copy of your JobPilot data.">
            <Button variant="outline" size="sm" onClick={() => toast('Data export is not available in this preview.', { type: 'info' })}>
              <Download className="h-4 w-4" /> Request export
            </Button>
          </Row>
        </Card>

        {/* Dev-only control to preview admin screens; not a real role change (guide §17). */}
        <Card className="px-5">
          <Row
            title="Developer: preview admin"
            description="Temporarily view admin screens in this scaffold. The real backend assigns roles server-side."
          >
            <Button
              variant={isAdmin ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                __setRole(isAdmin ? 'user' : 'admin')
                if (!isAdmin) navigate('/admin')
              }}
            >
              <Shield className="h-4 w-4" />
              {isAdmin ? 'Disable admin preview' : 'Enable admin preview'}
            </Button>
          </Row>
          <p className="pb-4 text-xs text-muted">Current role: {role}</p>
        </Card>

        <Card className="px-5">
          <Row title="Sign out" description="Sign out of JobPilot on this device.">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </Row>
        </Card>

        <Card className="border-error/30 px-5">
          <Row title="Delete account" description="Permanently delete your account and all associated data.">
            <Button variant="danger" size="sm" onClick={deleteAccount}>
              <Trash2 className="h-4 w-4" /> Delete account
            </Button>
          </Row>
        </Card>
      </div>
    </PageTransition>
  )
}
