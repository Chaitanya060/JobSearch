import { PageHeader } from '../../components/layout/Page.jsx'
import { JobsBrowser } from '../../features/jobs/JobsBrowser.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'

export default function FindJobs() {
  return (
    <PageTransition>
      <PageHeader title="Find jobs" description="Search and filter aggregated roles. Sorting by match uses your profile." />
      <JobsBrowser detailBase="/app/jobs" />
    </PageTransition>
  )
}
