import { Card } from '../ui/Card.jsx'
import { Skeleton } from './States.jsx'

// Lightweight responsive table: real columns on desktop, stacked on mobile.
export function DataTable({ columns, rows, loading, empty = 'No records.', rowKey = (r) => r.id }) {
  if (loading)
    return (
      <Card className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </Card>
    )
  if (!rows?.length) return <Card className="p-6 text-sm text-muted">{empty}</Card>

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-surface-2">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-text">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
