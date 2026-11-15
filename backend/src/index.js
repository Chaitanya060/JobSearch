import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requireAuth } from './middleware/auth.js'
import { ok, fail } from './lib/response.js'
import { getMe, getProfile, patchProfile, getPreferences, putPreferences } from './routes/user.js'

const app = new Hono()

// Tag every request with an id for safe, correlatable logs (no PII/secrets).
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

// Strict CORS — exact origin only, never "*" for credentialed APIs (spec §8).
app.use('*', (c, next) =>
  cors({
    origin: c.env.CORS_ORIGIN || 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86400,
  })(c, next)
)

// Public
app.get('/api/health', (c) => ok(c, { status: 'ok', env: c.env.APP_ENV || 'unknown' }))

// Authenticated
app.get('/api/me', requireAuth, getMe)
app.get('/api/profile/me', requireAuth, getProfile)
app.patch('/api/profile/me', requireAuth, patchProfile)
app.get('/api/preferences', requireAuth, getPreferences)
app.put('/api/preferences', requireAuth, putPreferences)

// Contract placeholders — built in later milestones (onboarding, R2, jobs, admin).
// They exist so the client contract is stable; they do NOT fake data.
const TODO = [
  ['post', '/api/profile/complete-onboarding'],
  ['get', '/api/profile/skills'],
  ['put', '/api/profile/skills'],
  ['get', '/api/profile/experience'],
  ['get', '/api/jobs'],
  ['get', '/api/jobs/recommended'],
  ['get', '/api/saved-jobs'],
  ['get', '/api/applications'],
  ['get', '/api/resumes'],
  ['post', '/api/resumes'],
  ['get', '/api/admin/overview'],
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
  // Scheduled job collection is a later phase; keep the trigger wired but inert.
  async scheduled(_event, _env, _ctx) {
    console.log('[jobpilot-api] scheduled run — ingestion not yet implemented')
  },
}
