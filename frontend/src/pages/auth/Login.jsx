import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthShell, GoogleButton, Divider } from './AuthShell.jsx'
import { TextField, PasswordField } from '../../components/forms/Fields.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const dest = location.state?.from || '/app'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) return setError('Enter your email and password.')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err?.message || 'Could not sign in. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your job search."
      footer={
        <>
          New to JobPilot?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <GoogleButton
        onClick={async () => {
          setError('')
          try {
            await signInWithGoogle()
            navigate(dest, { replace: true })
          } catch (err) {
            setError(err?.message || 'Google sign-in failed.')
          }
        }}
      />
      <Divider label="or continue with email" />
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-muted hover:text-text">
            Forgot password?
          </Link>
        </div>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
