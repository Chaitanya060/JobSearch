// DB row (snake_case) -> frontend job shape (camelCase) so existing UI works unchanged.
const SOURCE_NAMES = {
  himalayas: 'Himalayas',
  remoteok: 'Remote OK',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
}

export function mapJob(r, savedIds = null) {
  return {
    id: r.id,
    source: { key: r.provider_key, name: SOURCE_NAMES[r.provider_key] || r.provider_key },
    externalJobId: r.external_job_id,
    companyName: r.company_name,
    title: r.title,
    description: r.description,
    locationText: r.location,
    country: r.country,
    workMode: r.work_arrangement,
    employmentType: r.employment_type,
    experienceMin: r.experience_min ?? null,
    experienceMax: r.experience_max ?? null,
    salaryMin: r.salary_min,
    salaryMax: r.salary_max,
    salaryCurrency: r.currency,
    skills: r.skills || [],
    applyUrl: r.application_url,
    sourceJobUrl: r.source_url,
    postedAt: r.posted_at,
    lastSeenAt: r.last_seen_at,
    status: r.status,
    ...(savedIds ? { saved: savedIds.has(r.id) } : {}),
  }
}

// Application status: frontend labels <-> DB enum (only two differ).
const TO_DB = { saved: 'interested', prepared: 'preparing' }
const FROM_DB = { interested: 'saved', preparing: 'prepared' }
export const toDbStatus = (s) => TO_DB[s] || s
export const fromDbStatus = (s) => FROM_DB[s] || s
