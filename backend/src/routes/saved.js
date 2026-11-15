import { getSupabase } from '../lib/supabase.js'
import { ok, fail } from '../lib/response.js'
import { mapJob } from '../lib/jobMap.js'

// GET /api/saved-jobs — current user's saved jobs (joined to the real jobs).
export async function listSaved(c) {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('created_at, jobs(*)')
    .eq('firebase_uid', c.get('uid'))
    .order('created_at', { ascending: false })
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load saved jobs', 500)
  const jobs = (data || []).filter((r) => r.jobs).map((r) => ({ ...mapJob(r.jobs), saved: true }))
  return ok(c, jobs)
}

export async function saveJob(c) {
  const body = await c.req.json().catch(() => ({}))
  if (!body.jobId) return fail(c, 'VALIDATION_ERROR', 'jobId is required', 400)
  const supabase = getSupabase(c.env)
  const { error } = await supabase
    .from('saved_jobs')
    .upsert({ firebase_uid: c.get('uid'), job_id: body.jobId }, { onConflict: 'firebase_uid,job_id' })
  if (error) return fail(c, 'SERVER_ERROR', 'Could not save job', 500)
  return ok(c, { saved: true })
}

export async function unsaveJob(c) {
  const supabase = getSupabase(c.env)
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('firebase_uid', c.get('uid'))
    .eq('job_id', c.req.param('jobId'))
  if (error) return fail(c, 'SERVER_ERROR', 'Could not remove saved job', 500)
  return ok(c, { saved: false })
}
