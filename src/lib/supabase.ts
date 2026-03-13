/**
 * Supabase REST client — thin wrapper over fetch.
 * No @supabase/supabase-js dependency. Phase 4 will use this for queries.
 */

export const SUPABASE_URL = process.env.SUPABASE_URL ?? ''

export const supabaseHeaders = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

/**
 * Fetch helper for Supabase REST API.
 * Usage: supabaseRest('/rest/v1/leads?select=*', { method: 'GET' })
 */
export async function supabaseRest(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      ...supabaseHeaders,
      ...(init?.headers ?? {}),
    },
  })
}
