import { getSupabase } from '../lib/supabase.js'
import { ok, fail } from '../lib/response.js'
import { mapJob, toDbStatus, fromDbStatus } from '../lib/jobMap.js'

function mapApp(r) {
  return {
    id: r.id,
    jobId: r.job_id,
    status: fromDbStatus(r.status),
    applicationMethod: r.application_method || 'assisted',
    appliedAt: r.applied_at,
    notes: r.notes || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    job: r.jobs ? mapJob(r.jobs) : null,
  }
}

async function loadEvents(supabase, uid, id) {
  const { data } = await supabase
    .from('application_events')
    .select('*')
    .eq('application_id', id)
    .eq('firebase_uid', uid)
    .order('created_at', { ascending: true })
  return (data || []).map((e) => ({
    id: e.id,
    previousStatus: null,
    newStatus: fromDbStatus(e.event_type),
    eventNote: e.description,
    createdAt: e.created_at,
  }))
}

export async function listApplications(c) {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('firebase_uid', c.get('uid'))
    .order('updated_at', { ascending: false })
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load applications', 500)
  return ok(c, (data || []).map(mapApp))
}

export async function getApplication(c) {
  const supabase = getSupabase(c.env)
  const uid = c.get('uid')
  const id = c.req.param('id')
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('id', id)
    .eq('firebase_uid', uid)
    .maybeSingle()
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load application', 500)
  if (!data) return fail(c, 'NOT_FOUND', 'Application not found', 404)
  return ok(c, { ...mapApp(data), events: await loadEvents(supabase, uid, id) })
}

// POST /api/applications — only on explicit user action; one record per (user, job).
export async function createApplication(c) {
  const supabase = getSupabase(c.env)
  const uid = c.get('uid')
  const body = await c.req.json().catch(() => ({}))
  if (!body.jobId) return fail(c, 'VALIDATION_ERROR', 'jobId is required', 400)
  const dbStatus = toDbStatus(body.status || 'saved')
  const now = new Date().toISOString()

  const existing = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('firebase_uid', uid)
    .eq('job_id', body.jobId)
    .maybeSingle()
  if (existing.data) return ok(c, { ...mapApp(existing.data), events: await loadEvents(supabase, uid, existing.data.id) })

  const ins = await supabase
    .from('applications')
    .insert({
      firebase_uid: uid,
      job_id: body.jobId,
      status: dbStatus,
      application_method: 'assisted',
      applied_at: dbStatus === 'applied' ? now : null,
      notes: body.notes || null,
    })
    .select('*, jobs(*)')
    .single()
  if (ins.error) return fail(c, 'SERVER_ERROR', 'Could not create application', 500)
  await supabase.from('application_events').insert({ application_id: ins.data.id, firebase_uid: uid, event_type: dbStatus })
  return ok(c, { ...mapApp(ins.data), events: await loadEvents(supabase, uid, ins.data.id) })
}

export async function patchApplication(c) {
  const supabase = getSupabase(c.env)
  const uid = c.get('uid')
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))

  const cur = await supabase.from('applications').select('status, applied_at').eq('id', id).eq('firebase_uid', uid).maybeSingle()
  if (cur.error || !cur.data) return fail(c, 'NOT_FOUND', 'Application not found', 404)

  const now = new Date().toISOString()
  const patch = { updated_at: now }
  let newDbStatus = null
  if (body.status != null) {
    newDbStatus = toDbStatus(body.status)
    patch.status = newDbStatus
    if (newDbStatus === 'applied' && !cur.data.applied_at) patch.applied_at = now
  }
  if (body.notes != null) patch.notes = body.notes

  const upd = await supabase.from('applications').update(patch).eq('id', id).eq('firebase_uid', uid)
  if (upd.error) return fail(c, 'SERVER_ERROR', 'Could not update application', 500)
  if (newDbStatus && newDbStatus !== cur.data.status)
    await supabase.from('application_events').insert({ application_id: id, firebase_uid: uid, event_type: newDbStatus })

  const { data } = await supabase.from('applications').select('*, jobs(*)').eq('id', id).eq('firebase_uid', uid).maybeSingle()
  return ok(c, { ...mapApp(data), events: await loadEvents(supabase, uid, id) })
}
