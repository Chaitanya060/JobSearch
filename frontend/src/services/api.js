// Single data seam for the whole app. Components import ONLY this file, never
// mock files or fetch directly. Flip USE_MOCKS to false once the Cloudflare
// Worker API exists; the method signatures already mirror the guide's §14 contracts.

import { MOCK_JOBS, findJob } from './mock/jobs.js'
import { MOCK_PROFILE, MOCK_PREFERENCES, MOCK_RESUMES } from './mock/profile.js'
import { MOCK_SAVED_JOB_IDS, MOCK_APPLICATIONS } from './mock/applications.js'
import {
  MOCK_ADMIN_SOURCES,
  MOCK_BOARD_TARGETS,
  MOCK_INGESTION_RUNS,
  MOCK_SYSTEM_HEALTH,
} from './mock/admin.js'
import { computeMatch } from '../utils/match.js'

// Mock data mode. Still true while the real data endpoints are being built
// (Milestone 7). Auth is real when Firebase is configured; the mock-data banner
// shows whenever this is true. Opt in explicitly with VITE_USE_MOCKS=true.
export const USE_MOCKS =
  import.meta.env.VITE_USE_MOCKS === 'true' || !import.meta.env.VITE_FIREBASE_API_KEY
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// ---- real-backend transport (UID comes from the verified Firebase token) ----
let getAuthToken = async () => null
export function setTokenProvider(fn) {
  getAuthToken = fn
}

async function request(path, options = {}) {
  const token = await getAuthToken()
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error?.message || `Request failed (${res.status})`)
  // Unwrap the Worker's { data, error, meta } envelope.
  return body?.error ? Promise.reject(new Error(body.error.message)) : body?.data ?? body
}

// Always hits the real Worker — used after Firebase sign-in to decide onboarding
// vs. dashboard routing. Returns { profile, onboardingCompleted }.
export function getAccount() {
  return request('/api/me')
}

// ---- mock state (mutable within a session) ----
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))
let profile = { ...MOCK_PROFILE }
let prefs = { ...MOCK_PREFERENCES }
let savedIds = new Set(MOCK_SAVED_JOB_IDS)
let resumes = [...MOCK_RESUMES]
let applications = MOCK_APPLICATIONS.map((a) => ({ ...a, events: [...a.events] }))

function withMatch(job) {
  return { ...job, match: computeMatch(job, profile, prefs), saved: savedIds.has(job.id) }
}

function filterJobs(params = {}) {
  const q = (params.q || '').toLowerCase().trim()
  let list = MOCK_JOBS.filter((j) => j.status !== 'expired')
  if (q)
    list = list.filter((j) =>
      [j.title, j.companyName, ...(j.skills || [])].join(' ').toLowerCase().includes(q),
    )
  if (params.workMode) list = list.filter((j) => j.workMode === params.workMode)
  if (params.employmentType) list = list.filter((j) => j.employmentType === params.employmentType)
  if (params.source) list = list.filter((j) => j.source.key === params.source)
  if (params.location) {
    const loc = params.location.toLowerCase()
    list = list.filter((j) => (j.locationText || '').toLowerCase().includes(loc))
  }
  return list
}

function sortJobs(list, sort) {
  const arr = [...list]
  if (sort === 'newest')
    arr.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
  else if (sort === 'match')
    arr.sort((a, b) => computeMatch(b, profile, prefs).score - computeMatch(a, profile, prefs).score)
  return arr
}

export const api = {
  // ---- jobs (public) ----
  async getJobs(params = {}) {
    if (!USE_MOCKS) return request(`/api/jobs?${new URLSearchParams(params)}`)
    await delay()
    const filtered = sortJobs(filterJobs(params), params.sort || 'newest')
    const page = Number(params.page || 1)
    const limit = Number(params.limit || 10)
    const start = (page - 1) * limit
    return {
      jobs: filtered.slice(start, start + limit).map(withMatch),
      total: filtered.length,
      page,
      limit,
    }
  },

  async getJob(id) {
    if (!USE_MOCKS) return request(`/api/jobs/${id}`)
    await delay(160)
    const job = findJob(id)
    if (!job) throw new Error('Job not found')
    return withMatch(job)
  },

  async getRecommendedJobs() {
    if (!USE_MOCKS) return request('/api/recommended-jobs')
    await delay()
    return MOCK_JOBS.map(withMatch)
      .filter((j) => !j.match.hardMismatch)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 5)
  },

  // ---- saved jobs ----
  async getSavedJobs() {
    if (!USE_MOCKS) return request('/api/saved-jobs')
    await delay()
    return MOCK_JOBS.filter((j) => savedIds.has(j.id)).map(withMatch)
  },
  async saveJob(jobId) {
    if (!USE_MOCKS) return request('/api/saved-jobs', { method: 'POST', body: JSON.stringify({ jobId }) })
    await delay(140)
    savedIds.add(jobId)
    return { saved: true }
  },
  async unsaveJob(jobId) {
    if (!USE_MOCKS) return request(`/api/saved-jobs/${jobId}`, { method: 'DELETE' })
    await delay(140)
    savedIds.delete(jobId)
    return { saved: false }
  },

  // ---- profile / preferences ----
  async getMe() {
    if (!USE_MOCKS) return request('/api/me')
    await delay(120)
    return { ...profile }
  },
  async updateMe(patch) {
    if (!USE_MOCKS) return request('/api/me', { method: 'PUT', body: JSON.stringify(patch) })
    await delay()
    // role/id are not editable here (guide §6 security).
    const { role, id, ...safe } = patch
    profile = { ...profile, ...safe }
    return { ...profile }
  },
  async getPreferences() {
    if (!USE_MOCKS) return request('/api/preferences')
    await delay(120)
    return { ...prefs }
  },
  async updatePreferences(patch) {
    if (!USE_MOCKS) return request('/api/preferences', { method: 'PUT', body: JSON.stringify(patch) })
    await delay()
    prefs = { ...prefs, ...patch }
    return { ...prefs }
  },

  // ---- resumes (UI only this phase; no real R2) ----
  async getResumes() {
    if (!USE_MOCKS) return request('/api/resumes')
    await delay(120)
    return [...resumes]
  },
  async uploadResume(file) {
    if (!USE_MOCKS) throw new Error('Resume upload requires the backend API')
    await delay(600)
    const res = {
      id: `res-${Date.now()}`,
      originalFilename: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      isPrimary: resumes.length === 0,
      createdAt: new Date().toISOString(),
    }
    resumes = [...resumes, res]
    return res
  },
  async deleteResume(id) {
    if (!USE_MOCKS) return request(`/api/resumes/${id}`, { method: 'DELETE' })
    await delay(160)
    resumes = resumes.filter((r) => r.id !== id)
    return { deleted: true }
  },
  async setPrimaryResume(id) {
    if (!USE_MOCKS) return request(`/api/resumes/${id}/primary`, { method: 'PATCH' })
    await delay(140)
    resumes = resumes.map((r) => ({ ...r, isPrimary: r.id === id }))
    return [...resumes]
  },

  // ---- applications ----
  async getApplications() {
    if (!USE_MOCKS) return request('/api/applications')
    await delay()
    return applications.map((a) => ({ ...a, job: findJob(a.jobId) }))
  },
  async getApplication(id) {
    if (!USE_MOCKS) return request(`/api/applications/${id}`)
    await delay(140)
    const a = applications.find((x) => x.id === id)
    if (!a) throw new Error('Application not found')
    return { ...a, job: findJob(a.jobId) }
  },
  async createApplication({ jobId, status = 'saved' }) {
    if (!USE_MOCKS)
      return request('/api/applications', { method: 'POST', body: JSON.stringify({ jobId, status }) })
    await delay()
    const existing = applications.find((a) => a.jobId === jobId)
    if (existing) return { ...existing, job: findJob(existing.jobId) } // UNIQUE(user,job)
    const now = new Date().toISOString()
    const app = {
      id: `app-${Date.now()}`,
      jobId,
      status,
      applicationMethod: 'assisted',
      appliedAt: status === 'applied' ? now : null,
      notes: '',
      createdAt: now,
      updatedAt: now,
      events: [{ id: `ev-${Date.now()}`, previousStatus: null, newStatus: status, createdAt: now }],
    }
    applications = [app, ...applications]
    return { ...app, job: findJob(app.jobId) }
  },
  async updateApplication(id, { status, notes }) {
    if (!USE_MOCKS)
      return request(`/api/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status, notes }) })
    await delay()
    applications = applications.map((a) => {
      if (a.id !== id) return a
      const now = new Date().toISOString()
      const events = [...a.events]
      if (status && status !== a.status)
        events.push({ id: `ev-${Date.now()}`, previousStatus: a.status, newStatus: status, createdAt: now })
      return {
        ...a,
        status: status ?? a.status,
        notes: notes ?? a.notes,
        appliedAt: status === 'applied' && !a.appliedAt ? now : a.appliedAt,
        updatedAt: now,
        events,
      }
    })
    return this.getApplication(id)
  },

  // ---- admin ----
  async getAdminSources() {
    if (!USE_MOCKS) return request('/api/admin/sources')
    await delay()
    return [...MOCK_ADMIN_SOURCES]
  },
  async getBoardTargets() {
    if (!USE_MOCKS) return request('/api/admin/board-targets')
    await delay()
    return [...MOCK_BOARD_TARGETS]
  },
  async getIngestionRuns() {
    if (!USE_MOCKS) return request('/api/admin/ingestion-runs')
    await delay()
    return [...MOCK_INGESTION_RUNS]
  },
  async getSystemHealth() {
    if (!USE_MOCKS) return request('/api/admin/system-health')
    await delay()
    return { ...MOCK_SYSTEM_HEALTH }
  },
}
