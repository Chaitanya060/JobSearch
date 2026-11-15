import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { DataTable } from '../../components/data-display/DataTable.jsx'
import { StatusBadge } from '../../components/data-display/Badges.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { formatDate } from '../../utils/format.js'

export default function AdminJobs() {
  const { data, loading } = useAsync(() => api.getJobs({ limit: 50 }), [])
  const rows = data?.jobs || []

  const columns = [
    { key: 'title', header: 'Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'companyName', header: 'Company', render: (r) => <span className="text-muted">{r.companyName}</span> },
    { key: 'source', header: 'Source', render: (r) => <span className="text-muted">{r.source?.name}</span> },
    { key: 'postedAt', header: 'Posted', render: (r) => <span className="text-muted">{formatDate(r.postedAt)}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <PageTransition>
      <PageHeader title="Job management" description="Central jobs table across all sources." />
      <DataTable columns={columns} rows={rows} loading={loading} empty="No jobs collected yet." />
    </PageTransition>
  )
}
