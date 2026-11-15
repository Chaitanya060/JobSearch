import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { Logo } from '../../components/ui/Logo.jsx'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <p className="tabular text-5xl font-semibold text-text">404</p>
      <p className="text-muted">We couldn’t find that page.</p>
      <Button as={Link} to="/">
        Back to home
      </Button>
    </div>
  )
}
