import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { JobDetailView } from '../../features/jobs/JobDetailView.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'

export default function JobDetail() {
  const { jobId } = useParams()
  return (
    <PageTransition>
      <Link to="/app/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>
      <JobDetailView jobId={jobId} />
    </PageTransition>
  )
}
