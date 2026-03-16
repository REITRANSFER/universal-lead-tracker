import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

/**
 * GET /api/leads
 *
 * Returns paginated leads with optional filtering.
 *
 * Query params:
 *   client    - repeat for multi-value: ?client=slug1&client=slug2
 *   from      - ISO date string (start of range)
 *   to        - ISO date string (end of range)
 *   q         - search string (name, email, phone)
 *   offset    - pagination offset (default 0)
 *   limit     - page size (default 25, max 100)
 *   sort      - column.direction, e.g. received_at.desc (default)
 *
 * Response: { leads, total, offset, limit }
 */
export async function GET(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)

  // Parse params
  const clients = searchParams.getAll('client').filter(Boolean)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const q = searchParams.get('q')?.trim()
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0)
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  )
  const sort = searchParams.get('sort') ?? 'received_at.desc'

  // Build PostgREST query
  const params = new URLSearchParams()

  params.set(
    'select',
    'id,client_slug,received_at,first_name,last_name,email,phone,address,survey_answers,is_duplicate,duplicate_match_id,is_starred,is_flagged,survey_version'
  )

  // Client filter — PostgREST `in` operator
  if (clients.length > 0) {
    params.set('client_slug', `in.(${clients.join(',')})`)
  }

  // Date range — MUST use `and=()` to avoid URLSearchParams overwriting same key
  if (from && to) {
    params.set('and', `(received_at.gte.${from},received_at.lte.${to})`)
  } else if (from) {
    params.set('received_at', `gte.${from}`)
  } else if (to) {
    params.set('received_at', `lte.${to}`)
  }

  // Full-text search across contact fields
  if (q) {
    const encoded = encodeURIComponent(q)
    params.set(
      'or',
      `(first_name.ilike.*${encoded}*,last_name.ilike.*${encoded}*,email.ilike.*${encoded}*,phone.ilike.*${encoded}*)`
    )
  }

  // Sort
  const [sortCol, sortDir] = sort.split('.')
  params.set('order', `${sortCol}.${sortDir ?? 'desc'}`)

  const path = `/rest/v1/leads?${params.toString()}`

  const res = await supabaseRest(path, {
    headers: {
      Prefer: 'count=exact',
      Range: `${offset}-${offset + limit - 1}`,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[/api/leads] Supabase error:', res.status, body)
    return NextResponse.json(
      { error: 'Failed to fetch leads', detail: body },
      { status: 502 }
    )
  }

  // Parse Content-Range header: "offset-end/total" or "*/total"
  const contentRange = res.headers.get('Content-Range') ?? ''
  let total = 0
  const rangeMatch = contentRange.match(/\/(\d+)$/)
  if (rangeMatch) {
    total = parseInt(rangeMatch[1], 10)
  }

  const leads = await res.json()

  return NextResponse.json({ leads, total, offset, limit })
}
