// Hono auth middleware. Rejects anything that isn't a valid Firebase ID token,
// and puts the VERIFIED uid on the context. Never trust a client-supplied uid.
import { verifyFirebaseToken, TokenError } from '../lib/firebase.js'
import { fail } from '../lib/response.js'

export async function requireAuth(c, next) {
  const header = c.req.header('Authorization') || ''
  const match = /^Bearer (.+)$/.exec(header)
  if (!match) return fail(c, 'UNAUTHENTICATED', 'Missing or malformed Authorization header', 401)

  try {
    const user = await verifyFirebaseToken(match[1], c.env.FIREBASE_PROJECT_ID)
    c.set('uid', user.uid)
    c.set('user', user)
  } catch (err) {
    if (err instanceof TokenError) return fail(c, 'UNAUTHENTICATED', 'Invalid session', 401)
    return fail(c, 'AUTH_UNAVAILABLE', 'Could not verify session', 503)
  }
  await next()
}

// Optional auth: returns the verified uid if a valid token is present, else null.
// Never rejects — used on public routes that personalize when signed in.
export async function tryAuthUid(c) {
  const match = /^Bearer (.+)$/.exec(c.req.header('Authorization') || '')
  if (!match) return null
  try {
    return (await verifyFirebaseToken(match[1], c.env.FIREBASE_PROJECT_ID)).uid
  } catch {
    return null
  }
}

// Admin gate — role comes from the DB (admin_users), never from the client.
export async function requireAdmin(c, next) {
  const { getSupabase } = await import('../lib/supabase.js')
  const supabase = getSupabase(c.env)
  const { data, error } = await supabase
    .from('admin_users')
    .select('role')
    .eq('firebase_uid', c.get('uid'))
    .maybeSingle()
  if (error) return fail(c, 'SERVER_ERROR', 'Authorization check failed', 500)
  if (!data) return fail(c, 'FORBIDDEN', 'Admin access required', 403)
  c.set('role', data.role)
  await next()
}
