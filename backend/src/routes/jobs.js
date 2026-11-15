import { getSupabase } from '../lib/supabase.js'
import { tryAuthUid } from '../middleware/auth.js'
import { ok, fail } from '../lib/response.js'
import { mapJob } from '../lib/jobMap.js'

async function savedSet(supabase, uid) {
  if (!uid) return null
  const { data } = await supabase.from('saved_jobs').select('job_id').eq('firebase_uid', uid)
  return new Set((data || []).map((r) => r.job_id))
}

// GET /api/jobs — public list with filters + pagination; saved flags when signed in.
export async function listJobs(c) {
  const supabase = getSupabase(c.env)
  const uid = await tryAuthUid(c)
  const p = c.req.query()
  const page = Math.max(1, Number(p.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(p.limit) || 10))

  let q = supabase.from('jobs').select('*', { count: 'exact' }).neq('status', 'expired')
  if (p.q) q = q.or(`title.ilike.%${p.q}%,company_name.ilike.%${p.q}%`)
  if (p.workMode) q = q.eq('work_arrangement', p.workMode)
  if (p.employmentType) q = q.eq('employment_type', p.employmentType)
  if (p.source) q = q.eq('provider_key', p.source)
  if (p.location) q = q.ilike('location', `%${p.location}%`)
  q = q.order('posted_at', { ascending: false, nullsFirst: false }).range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await q
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load jobs', 500)
  const saved = await savedSet(supabase, uid)
  return ok(c, { jobs: (data || []).map((r) => mapJob(r, saved)), total: count ?? 0, page, limit })
}

// GET /api/jobs/:id — public detail.
export async function getJobById(c) {
  const supabase = getSupabase(c.env)
  const uid = await tryAuthUid(c)
  const { data, error } = await supabase.from('jobs').select('*').eq('id', c.req.param('id')).maybeSingle()
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load job', 500)
  if (!data) return fail(c, 'NOT_FOUND', 'Job not found', 404)
  const saved = await savedSet(supabase, uid)
  return ok(c, mapJob(data, saved))
}

// GET /api/recommended-jobs (auth). shortcut: newest active jobs; upgrade to
// profile-scored matching once skills/preferences are populated.
export async function recommendedJobs(c) {
  const supabase = getSupabase(c.env)
  const uid = c.get('uid')
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'active')
    .order('posted_at', { ascending: false, nullsFirst: false })
    .limit(5)
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load recommendations', 500)
  const saved = await savedSet(supabase, uid)
  return ok(c, (data || []).map((r) => mapJob(r, saved)))
}
