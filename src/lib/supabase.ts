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

/**
 * Fetch ALL rows from a Supabase table, paginating through the 1000-row default limit.
 * Returns the combined array of all rows.
 */
export async function supabaseRestAll<T = Record<string, unknown>>(
  path: string,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = []
  let offset = 0

  while (true) {
    const res = await supabaseRest(path, {
      headers: {
        Prefer: 'count=exact',
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    })

    if (!res.ok) {
      throw new Error(`Supabase error ${res.status}: ${await res.text()}`)
    }

    const rows: T[] = await res.json()
    all.push(...rows)

    // If we got fewer rows than the page size, we've reached the end
    if (rows.length < pageSize) break
    offset += pageSize
  }

  return all
}
