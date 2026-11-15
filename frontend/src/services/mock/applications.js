// DEVELOPMENT SEED — application + saved records for the signed-in dev user.

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString()

export const MOCK_SAVED_JOB_IDS = ['job-002', 'job-005']

export const MOCK_APPLICATIONS = [
  {
    id: 'app-1',
    jobId: 'job-001',
    status: 'applied',
    applicationMethod: 'assisted',
    appliedAt: daysAgo(4),
    notes: 'Submitted on company site. Mentioned referral from meetup.',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(4),
    events: [
      { id: 'e1', previousStatus: null, newStatus: 'saved', createdAt: daysAgo(6) },
      { id: 'e2', previousStatus: 'saved', newStatus: 'prepared', createdAt: daysAgo(5) },
      { id: 'e3', previousStatus: 'prepared', newStatus: 'applied', createdAt: daysAgo(4) },
    ],
  },
  {
    id: 'app-2',
    jobId: 'job-003',
    status: 'interview',
    applicationMethod: 'assisted',
    appliedAt: daysAgo(10),
    notes: 'First round scheduled for next week.',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(1),
    events: [
      { id: 'e4', previousStatus: null, newStatus: 'applied', createdAt: daysAgo(12) },
      { id: 'e5', previousStatus: 'applied', newStatus: 'assessment', createdAt: daysAgo(7) },
      { id: 'e6', previousStatus: 'assessment', newStatus: 'interview', createdAt: daysAgo(1) },
    ],
  },
]
