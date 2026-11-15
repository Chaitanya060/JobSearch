// Deterministic, rule-based match (Implementation Guide §11). No AI.
// The real backend will share this rule; keep it pure and explainable.
// Output is a "Profile match" / "Job fit" estimate — NEVER a hiring probability.

const ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  postgres: 'postgresql',
  'node': 'node.js',
  nodejs: 'node.js',
  reactjs: 'react',
  springboot: 'spring boot',
}

function norm(skill) {
  const s = String(skill || '').trim().toLowerCase()
  return ALIASES[s] || s
}

const WEIGHTS = { skills: 40, experience: 25, location: 15, role: 10, salary: 10 }

/**
 * @param job  normalized job record
 * @param profile { experienceYears }
 * @param prefs  { preferredSkills, preferredLocations, workModes, preferredRoles, minSalary }
 */
export function computeMatch(job, profile = {}, prefs = {}) {
  const jobSkills = (job.skills || []).map(norm)
  const userSkills = (prefs.preferredSkills || []).map(norm)
  const userSet = new Set(userSkills)

  const matchedSkills = jobSkills.filter((s) => userSet.has(s))
  const missingSkills = jobSkills.filter((s) => !userSet.has(s))

  const reasons = []

  // Skills (40)
  const skillPts = jobSkills.length
    ? (matchedSkills.length / jobSkills.length) * WEIGHTS.skills
    : WEIGHTS.skills * 0.5
  if (matchedSkills.length) reasons.push(`Strong skills overlap (${matchedSkills.length}/${jobSkills.length})`)

  // Experience (25) — hard requirement handled separately below.
  const years = Number(profile.experienceYears ?? 0)
  const reqMin = job.experienceMin ?? 0
  const reqMax = job.experienceMax
  let hardMismatch = false
  let expPts = WEIGHTS.experience
  if (years < reqMin) {
    // e.g. job wants 5+ and user is a fresher: strong penalty + flag.
    const gap = reqMin - years
    hardMismatch = gap >= 2
    expPts = Math.max(0, WEIGHTS.experience - gap * 8)
    reasons.push(`Needs ${reqMin}+ yrs experience`)
  } else if (reqMax != null && years > reqMax + 3) {
    expPts = WEIGHTS.experience * 0.6
    reasons.push('You may be over-qualified')
  } else {
    reasons.push('Experience fits')
  }

  // Location / work mode (15)
  const locs = (prefs.preferredLocations || []).map((l) => l.toLowerCase())
  const modes = (prefs.workModes || []).map((m) => m.toLowerCase())
  const jobLoc = (job.locationText || '').toLowerCase()
  const jobMode = (job.workMode || '').toLowerCase()
  let locPts = 0
  const remoteWanted = modes.includes('remote')
  if (jobMode === 'remote' && remoteWanted) {
    locPts = WEIGHTS.location
    reasons.push('Remote — matches your preference')
  } else if (locs.some((l) => jobLoc.includes(l))) {
    locPts = WEIGHTS.location
    reasons.push('In a preferred location')
  } else if (!locs.length && !modes.length) {
    locPts = WEIGHTS.location * 0.5
  } else {
    locPts = WEIGHTS.location * 0.25
  }

  // Role/title (10)
  const roles = (prefs.preferredRoles || []).map((r) => r.toLowerCase())
  const title = (job.title || '').toLowerCase()
  const rolePts = roles.some((r) => title.includes(r) || r.includes(title))
    ? WEIGHTS.role
    : roles.length
      ? WEIGHTS.role * 0.3
      : WEIGHTS.role * 0.5

  // Salary (10)
  let salaryPts = WEIGHTS.salary * 0.5 // neutral when unknown
  if (job.salaryMax != null && prefs.minSalary != null) {
    salaryPts = job.salaryMax >= prefs.minSalary ? WEIGHTS.salary : 0
  }

  let score = Math.round(skillPts + expPts + locPts + rolePts + salaryPts)
  if (hardMismatch) score = Math.min(score, 45)
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    matchedSkills,
    missingSkills,
    hardMismatch,
    reasons,
  }
}

export function matchBand(score) {
  if (score >= 75) return { label: 'Strong fit', tone: 'success' }
  if (score >= 50) return { label: 'Good fit', tone: 'info' }
  if (score >= 30) return { label: 'Partial fit', tone: 'warning' }
  return { label: 'Low fit', tone: 'muted' }
}
