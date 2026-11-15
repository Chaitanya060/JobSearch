import { Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/Page.jsx'
import { EmptyState } from '../../components/data-display/States.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'

export default function AdminUsers() {
  return (
    <PageTransition>
      <PageHeader title="Users" description="Minimal user information only — private data such as resumes is never shown here." />
      <Card className="p-0">
        <EmptyState
          icon={Users}
          title="User management is backend-gated"
          message="This screen will list only the minimum necessary fields once the Worker API and admin authorization are connected."
        />
      </Card>
    </PageTransition>
  )
}
