import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../../services/api.js'
import { JobCard } from '../../components/data-display/JobCard.jsx'
import { EmptyState, ErrorState, JobCardSkeleton } from '../../components/data-display/States.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField } from '../../components/forms/Fields.jsx'
import { Drawer } from '../../components/feedback/Overlay.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'
import { StaggerContainer, StaggerItem } from '../../components/motion/Motion.jsx'
import { JobFilters, EMPTY_FILTERS } from './JobFilters.jsx'

const LIMIT = 6

export function JobsBrowser({ isPublic = false, detailBase = '/app/jobs' }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  const debounce = useRef()

  const load = (f, p) => {
    setLoading(true)
    setError(null)
    api
      .getJobs({ ...f, page: p, limit: LIMIT })
      .then(setResult)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  // Debounce filter changes so typing doesn't refetch every keystroke.
  useEffect(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => load(filters, page), 250)
    return () => clearTimeout(debounce.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page])

  const updateFilters = (next) => {
    setPage(1)
    setFilters(next)
  }

  const onToggleSave = async (job) => {
    if (isPublic) {
      navigate('/login')
      return
    }
    try {
      if (job.saved) await api.unsaveJob(job.id)
      else await api.saveJob(job.id)
      toast(job.saved ? 'Removed from saved' : 'Saved', { type: 'success' })
      load(filters, page)
    } catch {
      toast('Could not update saved jobs', { type: 'error' })
    }
  }

  const total = result?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Desktop filter rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-text">Filters</h2>
          <JobFilters filters={filters} onChange={updateFilters} onReset={() => updateFilters(EMPTY_FILTERS)} />
        </div>
      </aside>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={filters.q}
              onChange={(e) => updateFilters({ ...filters, q: e.target.value })}
              placeholder="Search title, company or skill"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Search jobs"
            />
          </div>
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Filters">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {loading ? 'Searching…' : `${total} ${total === 1 ? 'job' : 'jobs'}`}
          </p>
          <SelectField
            value={filters.sort}
            onChange={(e) => updateFilters({ ...filters, sort: e.target.value })}
            className="w-44"
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            <option value="match">Match score</option>
          </SelectField>
        </div>

        {error ? (
          <ErrorState onRetry={() => load(filters, page)} />
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : total === 0 ? (
          <EmptyState
            icon={Search}
            title="No jobs found"
            message="Try removing a filter or searching a different term."
            action={
              <Button variant="outline" size="sm" onClick={() => updateFilters(EMPTY_FILTERS)}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <StaggerContainer className="space-y-3">
            {result.jobs.map((job) => (
              <StaggerItem key={job.id}>
                <JobCard job={job} onToggleSave={onToggleSave} to={`${detailBase}/${job.id}`} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {totalPages > 1 && !loading && !error && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="tabular text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters" side="left">
        <JobFilters
          filters={filters}
          onChange={updateFilters}
          onReset={() => {
            updateFilters(EMPTY_FILTERS)
            setDrawerOpen(false)
          }}
        />
      </Drawer>
    </div>
  )
}
