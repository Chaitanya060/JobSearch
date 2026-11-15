// Authenticated user routes: identity bootstrap, profile, preferences.
// Every query filters by the VERIFIED uid from the token (c.get('uid')).
import { z } from 'zod'
import { getSupabase } from '../lib/supabase.js'
import { ok, fail } from '../lib/response.js'

// GET /api/me — verify token, upsert a profile shell from verified claims,
// return profile + onboarding status so the client can route to /onboarding or /app.
export async function getMe(c) {
  let supabase
  try {
    supabase = getSupabase(c.env)
  } catch {
    return fail(c, 'CONFIG_MISSING', 'Backend data store is not configured', 503)
  }
  const uid = c.get('uid')
  const user = c.get('user')

  const existing = await supabase.from('profiles').select('*').eq('firebase_uid', uid).maybeSingle()
  if (existing.error) return fail(c, 'SERVER_ERROR', 'Could not load profile', 500)

  let profile = existing.data
  if (!profile) {
    // Shell only — from verified claims. Never infer education/skills/experience.
    const created = await supabase
      .from('profiles')
      .insert({ firebase_uid: uid, email: user.email, full_name: user.name, photo_url: user.picture })
      .select('*')
      .single()
    if (created.error) return fail(c, 'SERVER_ERROR', 'Could not create profile', 500)
    profile = created.data
  }

  return ok(c, { profile, onboardingCompleted: !!profile.onboarding_completed })
}

// POST /api/profile/complete-onboarding — mark the profile done so the user
// reaches the app. The real 7-step flow (Milestone 5) will call this after save.
export async function completeOnboarding(c) {
  const supabase = getSupabase(c.env)
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true, profile_completed_at: now, updated_at: now })
    .eq('firebase_uid', c.get('uid'))
    .select('*')
    .single()
  if (error) return fail(c, 'SERVER_ERROR', 'Could not complete onboarding', 500)
  return ok(c, { profile: data, onboardingCompleted: true })
}

export async function getProfile(c) {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', c.get('uid'))
    .maybeSingle()
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load profile', 500)
  if (!data) return fail(c, 'NOT_FOUND', 'Profile not found', 404)
  return ok(c, data)
}

// Only these fields are user-editable. role/id/firebase_uid/onboarding_* are NOT.
const profilePatch = z
  .object({
    full_name: z.string().max(120).optional(),
    phone: z.string().max(40).nullable().optional(),
    country: z.string().max(80).nullable().optional(),
    city: z.string().max(80).nullable().optional(),
    linkedin_url: z.string().url().max(300).nullable().optional(),
    github_url: z.string().url().max(300).nullable().optional(),
    portfolio_url: z.string().url().max(300).nullable().optional(),
    education_level: z.string().max(80).nullable().optional(),
    degree: z.string().max(120).nullable().optional(),
    specialization: z.string().max(120).nullable().optional(),
    college_name: z.string().max(160).nullable().optional(),
    graduation_year: z.number().int().min(1950).max(2100).nullable().optional(),
    experience_level: z.string().max(40).nullable().optional(),
  })
  .strict()

export async function patchProfile(c) {
  const body = await c.req.json().catch(() => null)
  const parsed = profilePatch.safeParse(body)
  if (!parsed.success) return fail(c, 'VALIDATION_ERROR', 'Invalid profile fields', 400)

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('firebase_uid', c.get('uid'))
    .select('*')
    .single()
  if (error) return fail(c, 'SERVER_ERROR', 'Could not save profile', 500)
  return ok(c, data)
}

export async function getPreferences(c) {
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('firebase_uid', c.get('uid'))
    .maybeSingle()
  if (error) return fail(c, 'SERVER_ERROR', 'Could not load preferences', 500)
  return ok(c, data || null)
}

const prefsPut = z
  .object({
    target_roles: z.array(z.string()).max(50).optional(),
    preferred_locations: z.array(z.string()).max(50).optional(),
    employment_types: z.array(z.string()).max(20).optional(),
    work_arrangements: z.array(z.string()).max(10).optional(),
    experience_preference: z.string().max(40).nullable().optional(),
    minimum_salary: z.number().nonnegative().nullable().optional(),
    maximum_salary: z.number().nonnegative().nullable().optional(),
    currency: z.string().max(8).optional(),
  })
  .strict()
  .refine((v) => v.minimum_salary == null || v.maximum_salary == null || v.minimum_salary <= v.maximum_salary, {
    message: 'minimum_salary must be <= maximum_salary',
  })

export async function putPreferences(c) {
  const body = await c.req.json().catch(() => null)
  const parsed = prefsPut.safeParse(body)
  if (!parsed.success) return fail(c, 'VALIDATION_ERROR', 'Invalid preferences', 400)

  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      { firebase_uid: c.get('uid'), ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: 'firebase_uid' },
    )
    .select('*')
    .single()
  if (error) return fail(c, 'SERVER_ERROR', 'Could not save preferences', 500)
  return ok(c, data)
}
