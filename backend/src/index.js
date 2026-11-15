import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requireAuth } from './middleware/auth.js'
import { ok, fail } from './lib/response.js'
import { getMe, getProfile, patchProfile, getPreferences, putPreferences, completeOnboarding } from './routes/user.js'
import { listJobs, getJobById, recommendedJobs } from './routes/jobs.js'
import { listSaved, saveJob, unsaveJob } from './routes/saved.js'
import { listApplications, getApplication, createApplication, patchApplication } from './routes/applications.js'

const app = new Hono()

// Tag every request with an id for safe, correlatable logs (no PII/secrets).
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

// Strict CORS — exact origin only, never "*" for credentialed APIs.
app.use('*', (c, next) =>
  cors({
    origin: c.env.CORS_ORIGIN || 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400,
  })(c, next)
)

// ---- Public ----
app.get('/api/health', (c) => ok(c, { status: 'ok', env: c.env.APP_ENV || 'unknown' }))
app.get('/api/jobs', listJobs)
app.get('/api/jobs/:id', getJobById)

// ---- Authenticated ----
app.get('/api/me', requireAuth, getMe)
app.post('/api/profile/complete-onboarding', requireAuth, completeOnboarding)
app.get('/api/profile/me', requireAuth, getProfile)
app.patch('/api/profile/me', requireAuth, patchProfile)
app.get('/api/preferences', requireAuth, getPreferences)
app.put('/api/preferences', requireAuth, putPreferences)

app.get('/api/recommended-jobs', requireAuth, recommendedJobs)

app.get('/api/saved-jobs', requireAuth, listSaved)
app.post('/api/saved-jobs', requireAuth, saveJob)
app.delete('/api/saved-jobs/:jobId', requireAuth, unsaveJob)

app.get('/api/applications', requireAuth, listApplications)
app.get('/api/applications/:id', requireAuth, getApplication)
app.post('/api/applications', requireAuth, createApplication)
app.patch('/api/applications/:id', requireAuth, patchApplication)

// Resumes: list is empty until R2 upload lands (Milestone 6).
app.get('/api/resumes', requireAuth, (c) => ok(c, []))

// Not yet built (later milestones): profile skills/experience, resume upload, admin.
const TODO = [
  ['get', '/api/profile/skills'],
  ['put', '/api/profile/skills'],
  ['get', '/api/profile/experience'],
  ['post', '/api/resumes'],
  ['get', '/api/admin/overview'],
  ['get', '/api/admin/sources'],
  ['get', '/api/admin/ingestion-runs'],
  ['get', '/api/admin/jobs'],
]
for (const [method, path] of TODO) {
  app[method](path, requireAuth, (c) => fail(c, 'NOT_IMPLEMENTED', 'Endpoint not yet available', 501))
}

app.notFound((c) => fail(c, 'NOT_FOUND', 'Route not found', 404))
app.onError((err, c) => {
  console.error('[jobpilot-api]', c.get('requestId'), err?.name || 'Error')
  return fail(c, 'SERVER_ERROR', 'Unexpected server error', 500)
})

export default {
  fetch: app.fetch,
  async scheduled(_event, _env, _ctx) {
    console.log('[jobpilot-api] scheduled run — ingestion not yet implemented')
  },
}
