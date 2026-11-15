import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { DataTable } from '../../components/data-display/DataTable.jsx'
import { Badge } from '../../components/data-display/Badges.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { formatDate } from '../../utils/format.js'

export default function AdminBoardTargets() {
  const { data, loading } = useAsync(() => api.getBoardTargets(), [])

  const columns = [
    { key: 'companyName', header: 'Company', render: (r) => <span className="font-medium">{r.companyName}</span> },
    { key: 'sourceKey', header: 'Source', render: (r) => <span className="text-muted">{r.sourceKey}</span> },
    { key: 'boardIdentifier', header: 'Board ID', render: (r) => <code className="text-xs text-muted">{r.boardIdentifier}</code> },
    { key: 'country', header: 'Country', render: (r) => <span className="text-muted">{r.country}</span> },
    {
      key: 'isEnabled',
      header: 'State',
      render: (r) => <Badge tone={r.isEnabled ? 'success' : 'muted'}>{r.isEnabled ? 'Enabled' : 'Disabled'}</Badge>,
    },
    { key: 'lastCheckedAt', header: 'Last checked', render: (r) => <span className="text-muted">{formatDate(r.lastCheckedAt)}</span> },
  ]

  return (
    <PageTransition>
      <PageHeader
        title="Company board targets"
        description="Employer board identifiers for Greenhouse / Lever / Ashby collection."
        actions={<Button size="sm">Add target</Button>}
      />
      <DataTable columns={columns} rows={data} loading={loading} empty="No board targets yet." />
    </PageTransition>
  )
}
