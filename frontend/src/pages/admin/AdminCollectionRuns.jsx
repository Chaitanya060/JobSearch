import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { DataTable } from '../../components/data-display/DataTable.jsx'
import { Badge } from '../../components/data-display/Badges.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { formatDate } from '../../utils/format.js'

const TONE = { success: 'success', partial: 'warning', failed: 'error', running: 'info' }

export default function AdminCollectionRuns() {
  const { data, loading } = useAsync(() => api.getIngestionRuns(), [])

  const columns = [
    { key: 'sourceKey', header: 'Source', render: (r) => <span className="font-medium">{r.sourceKey}</span> },
    { key: 'startedAt', header: 'Started', render: (r) => <span className="text-muted">{formatDate(r.startedAt)}</span> },
    { key: 'fetched', header: 'Fetched', render: (r) => <span className="tabular">{r.fetched}</span> },
    { key: 'inserted', header: 'Inserted', render: (r) => <span className="tabular">{r.inserted}</span> },
    { key: 'updated', header: 'Updated', render: (r) => <span className="tabular">{r.updated}</span> },
    { key: 'errors', header: 'Errors', render: (r) => <span className="tabular">{r.errors}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={TONE[r.status] || 'muted'}>{r.status}</Badge> },
  ]

  return (
    <PageTransition>
      <PageHeader title="Collection logs" description="Job collection run history and error summaries." />
      <DataTable columns={columns} rows={data} loading={loading} empty="No collection runs recorded." />
    </PageTransition>
  )
}
