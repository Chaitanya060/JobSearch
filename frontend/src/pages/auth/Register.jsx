import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, GoogleButton, Divider } from './AuthShell.jsx'
import { TextField, PasswordField } from '../../components/forms/Fields.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export default function Register() {
  const { register, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.fullName || !form.email || !form.password) return setError('Please fill in all fields.')
    if (form.password.length < 8) return setError('Use at least 8 characters for your password.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await register(form)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err?.message || 'Could not create your account. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start organizing your job search."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton
        onClick={async () => {
          setError('')
          try {
            await signInWithGoogle()
            navigate('/app', { replace: true })
          } catch (err) {
            setError(err?.message || 'Google sign-in failed.')
          }
        }}
      />
      <Divider label="or sign up with email" />
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Full name" autoComplete="name" value={form.fullName} onChange={set('fullName')} />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        <PasswordField label="Password" hint="At least 8 characters." autoComplete="new-password" value={form.password} onChange={set('password')} />
        <PasswordField label="Confirm password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
        <p className="text-xs text-muted">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="underline">Terms</Link> and{' '}
          <Link to="/privacy" className="underline">Privacy policy</Link>.
        </p>
      </form>
    </AuthShell>
  )
}
