import { useRef, useState } from 'react'
import { FileText, UploadCloud, Trash2, Star, ShieldCheck } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { PageHeader } from '../../components/layout/Page.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/data-display/Badges.jsx'
import { ErrorState, Skeleton } from '../../components/data-display/States.jsx'
import { PageTransition } from '../../components/motion/Motion.jsx'
import { useToast } from '../../components/feedback/ToastProvider.jsx'
import { useConfirm } from '../../components/feedback/ConfirmProvider.jsx'
import { formatDate } from '../../utils/format.js'
import { cn } from '../../utils/cn.js'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

function sizeLabel(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Resumes() {
  const { data, loading, error, reload } = useAsync(() => api.getResumes(), [])
  const toast = useToast()
  const confirm = useConfirm()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files) => {
    const file = files?.[0]
    if (!file) return
    if (!ACCEPT.includes(file.type)) return toast('Only PDF and DOCX files are allowed.', { type: 'error' })
    if (file.size > MAX_BYTES) return toast('File is larger than 5 MB.', { type: 'error' })
    setUploading(true)
    try {
      await api.uploadResume(file)
      toast('Resume uploaded', { type: 'success' })
      reload()
    } catch {
      toast('Upload failed. Try again.', { type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const remove = async (r) => {
    const ok = await confirm({
      title: 'Delete resume?',
      message: `Permanently delete “${r.originalFilename}”? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    await api.deleteResume(r.id)
    toast('Resume deleted', { type: 'success' })
    reload()
  }

  const setPrimary = async (r) => {
    await api.setPrimaryResume(r.id)
    toast(`“${r.originalFilename}” is now your primary resume`, { type: 'success' })
    reload()
  }

  return (
    <PageTransition>
      <PageHeader title="Resumes" description="Upload and manage your resumes. Files are private to you." />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-surface',
        )}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-muted" aria-hidden />
        <p className="text-sm text-text">Drag & drop a resume here</p>
        <p className="mt-1 text-xs text-muted">PDF or DOCX · up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button className="mt-4" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
          Browse files
        </Button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        Resumes are stored privately and downloaded only through an authenticated link — never a
        public URL. Admins do not see your resume contents by default.
      </div>

      <div className="mt-6 space-y-3">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading ? (
          <Card className="p-4">
            <Skeleton className="h-5 w-1/2" />
          </Card>
        ) : !data?.length ? (
          <p className="text-sm text-muted">No resumes uploaded yet.</p>
        ) : (
          data.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-muted">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-text">{r.originalFilename}</p>
                  {r.isPrimary && <Badge tone="primary">Primary</Badge>}
                </div>
                <p className="text-xs text-muted">
                  {sizeLabel(r.fileSizeBytes)} · uploaded {formatDate(r.createdAt)}
                </p>
              </div>
              {!r.isPrimary && (
                <Button variant="ghost" size="sm" onClick={() => setPrimary(r)}>
                  <Star className="h-4 w-4" /> Make primary
                </Button>
              )}
              <Button variant="ghost" size="icon" aria-label="Delete resume" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4 text-error" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </PageTransition>
  )
}
