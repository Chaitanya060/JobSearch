import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ContentContainer } from '../../components/layout/Page.jsx'
import { JobDetailView } from '../../features/jobs/JobDetailView.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'

export default function PublicJobDetail() {
  const { jobId } = useParams()
  return (
    <PageTransition>
      <ContentContainer className="py-8">
        <Link to="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <JobDetailView jobId={jobId} isPublic />
      </ContentContainer>
    </PageTransition>
  )
}
