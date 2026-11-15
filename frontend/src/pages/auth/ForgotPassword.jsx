import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { AuthShell } from './AuthShell.jsx'
import { TextField } from '../../components/forms/Fields.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await resetPassword(email)
    setLoading(false)
    setSent(true) // Neutral message — do not reveal whether the email has an account.
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We’ll email you a link to set a new password."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          If an account exists for that email, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
