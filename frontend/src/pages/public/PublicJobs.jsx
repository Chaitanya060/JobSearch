import { ContentContainer, PageHeader } from '../../components/layout/Page.jsx'
import { JobsBrowser } from '../../features/jobs/JobsBrowser.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'

export default function PublicJobs() {
  return (
    <PageTransition>
      <ContentContainer className="py-8">
        <PageHeader
          title="Browse jobs"
          description="Listings aggregated from external sources. Sign in for personalized match scores."
        />
        <JobsBrowser isPublic detailBase="/jobs" />
      </ContentContainer>
    </PageTransition>
  )
}
