import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { DataTable } from '../../components/data-display/DataTable.jsx'
import { Badge } from '../../components/data-display/Badges.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { formatDate } from '../../utils/format.js'

export default function AdminSources() {
  const { data, loading } = useAsync(() => api.getAdminSources(), [])

  const columns = [
    { key: 'displayName', header: 'Source', render: (r) => <span className="font-medium">{r.displayName}</span> },
    { key: 'sourceType', header: 'Type', render: (r) => <span className="text-muted">{r.sourceType}</span> },
    {
      key: 'isEnabled',
      header: 'State',
      render: (r) => <Badge tone={r.isEnabled ? 'success' : 'muted'}>{r.isEnabled ? 'Enabled' : 'Disabled'}</Badge>,
    },
    { key: 'lastSuccessAt', header: 'Last success', render: (r) => <span className="text-muted">{formatDate(r.lastSuccessAt)}</span> },
    {
      key: 'lastError',
      header: 'Last error',
      render: (r) => (r.lastError ? <span className="text-error">{r.lastError}</span> : <span className="text-muted">—</span>),
    },
    { key: 'targetCount', header: 'Boards', render: (r) => <span className="tabular">{r.targetCount}</span> },
  ]

  return (
    <PageTransition>
      <PageHeader title="Job sources" description="Providers and feeds. Disable a broken source without a code change." />
      <DataTable columns={columns} rows={data} loading={loading} empty="No sources configured." />
    </PageTransition>
  )
}
