// Server-side Supabase client (spec §8). The secret key bypasses RLS, so every
// user query MUST filter by the verified uid — RLS alone is not enough.
import { createClient } from '@supabase/supabase-js'

export function getSupabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase is not configured')
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
