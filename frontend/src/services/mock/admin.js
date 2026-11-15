// DEVELOPMENT SEED — admin dashboard data.

const hoursAgo = (n) => new Date(Date.now() - n * 3_600_000).toISOString()

export const MOCK_ADMIN_SOURCES = [
  { id: 's1', sourceKey: 'himalayas', displayName: 'Himalayas', sourceType: 'feed', isEnabled: true, lastSuccessAt: hoursAgo(5), lastError: null, targetCount: 0 },
  { id: 's2', sourceKey: 'remoteok', displayName: 'Remote OK', sourceType: 'feed', isEnabled: true, lastSuccessAt: hoursAgo(5), lastError: null, targetCount: 0 },
  { id: 's3', sourceKey: 'greenhouse', displayName: 'Greenhouse', sourceType: 'ats_board', isEnabled: true, lastSuccessAt: hoursAgo(5), lastError: null, targetCount: 3 },
  { id: 's4', sourceKey: 'lever', displayName: 'Lever', sourceType: 'ats_board', isEnabled: true, lastSuccessAt: hoursAgo(11), lastError: null, targetCount: 2 },
  { id: 's5', sourceKey: 'ashby', displayName: 'Ashby', sourceType: 'ats_board', isEnabled: false, lastSuccessAt: hoursAgo(30), lastError: 'HTTP 503 from provider', targetCount: 1 },
]

export const MOCK_BOARD_TARGETS = [
  { id: 't1', sourceKey: 'greenhouse', companyName: 'Northwind Labs', boardIdentifier: 'northwind', country: 'India', isEnabled: true, lastCheckedAt: hoursAgo(5) },
  { id: 't2', sourceKey: 'lever', companyName: 'Brightpath', boardIdentifier: 'brightpath', country: 'India', isEnabled: true, lastCheckedAt: hoursAgo(11) },
  { id: 't3', sourceKey: 'ashby', companyName: 'Meridian', boardIdentifier: 'meridian', country: 'India', isEnabled: false, lastCheckedAt: hoursAgo(30) },
]

export const MOCK_INGESTION_RUNS = [
  { id: 'r1', sourceKey: 'greenhouse', startedAt: hoursAgo(5), finishedAt: hoursAgo(5), fetched: 42, inserted: 6, updated: 30, skipped: 6, errors: 0, status: 'success' },
  { id: 'r2', sourceKey: 'remoteok', startedAt: hoursAgo(5), finishedAt: hoursAgo(5), fetched: 120, inserted: 14, updated: 80, skipped: 26, errors: 0, status: 'success' },
  { id: 'r3', sourceKey: 'ashby', startedAt: hoursAgo(30), finishedAt: hoursAgo(30), fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: 1, status: 'failed', errorMessage: 'HTTP 503 from provider' },
]

export const MOCK_SYSTEM_HEALTH = {
  activeJobs: 6,
  jobsAddedRecent: 20,
  enabledSources: 4,
  failedRuns: 1,
  expiredAwaitingCleanup: 1,
  totalUsers: 1,
  recentErrors: [{ id: 'err1', at: hoursAgo(30), message: 'ashby: HTTP 503 from provider' }],
}
