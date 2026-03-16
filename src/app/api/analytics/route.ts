import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

interface UtmCount {
  value: string
  count: number
  pct: number
}

interface DuplicateRate {
  client_slug: string
  total: number
  duplicates: number
  rate: number
}

interface AnalyticsResponse {
  utm_source: UtmCount[]
  utm_medium: UtmCount[]
  utm_campaign: UtmCount[]
  duplicate_rates: DuplicateRate[]
  total_leads: number
  total_duplicates: number
}

interface LeadAnalyticsRow {
  client_slug: string
  survey_answers: Record<string, unknown> | null
  is_duplicate: boolean | null
}

/**
 * GET /api/analytics
 *
 * Returns UTM attribution aggregation and per-client duplicate rates.
 *
 * Query params:
 *   client   - repeat for multi-value: ?client=slug1&client=slug2
 *   from     - ISO date string (start of range)
 *   to       - ISO date string (end of range)
 *
 * Response: AnalyticsResponse
 */
export async function GET(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const clients = searchParams.getAll('client').filter(Boolean)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Fetch minimal fields — only what's needed for UTM aggregation + duplicate rates
  const params = new URLSearchParams()
  params.set('select', 'client_slug,survey_answers,is_duplicate')

  // Client filter
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

  const res = await supabaseRest(`/rest/v1/leads?${params.toString()}`)

  if (!res.ok) {
    const body = await res.text()
    console.error('[/api/analytics] Supabase error:', res.status, body)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', detail: body },
      { status: 502 }
    )
  }

  const rows: LeadAnalyticsRow[] = await res.json()

  // -------------------------------------------------------------------
  // Aggregate UTM counts from survey_answers JSONB
  // Normalize missing/null values to "(none)" — totals add up to total_leads
  // Lowercase all values for case-insensitive grouping (avoids facebook vs Facebook)
  // -------------------------------------------------------------------
  const utmDimensions = ['utm_source', 'utm_medium', 'utm_campaign'] as const
  const utmMaps: Record<string, Map<string, number>> = {
    utm_source: new Map(),
    utm_medium: new Map(),
    utm_campaign: new Map(),
  }

  // Per-client duplicate tracking
  const duplicateMap = new Map<string, { total: number; duplicates: number }>()

  for (const row of rows) {
    const answers = row.survey_answers ?? {}

    // UTM aggregation
    for (const dim of utmDimensions) {
      const raw = answers[dim]
      const normalized =
        typeof raw === 'string' && raw.trim().length > 0
          ? raw.trim().toLowerCase()
          : '(none)'
      utmMaps[dim].set(normalized, (utmMaps[dim].get(normalized) ?? 0) + 1)
    }

    // Duplicate rate per client
    const slug = row.client_slug
    if (!duplicateMap.has(slug)) {
      duplicateMap.set(slug, { total: 0, duplicates: 0 })
    }
    const entry = duplicateMap.get(slug)!
    entry.total++
    if (row.is_duplicate === true) entry.duplicates++
  }

  // -------------------------------------------------------------------
  // Convert UTM maps to sorted arrays (by count desc)
  // pct is percentage of total_leads (not just leads with that dimension)
  // so the "(none)" row makes clear how many leads have no UTM data
  // -------------------------------------------------------------------
  const totalLeads = rows.length

  function toSortedUtm(m: Map<string, number>): UtmCount[] {
    return Array.from(m.entries())
      .map(([value, count]) => ({
        value,
        count,
        pct: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }

  const totalDuplicates = rows.filter((r) => r.is_duplicate === true).length

  const duplicate_rates: DuplicateRate[] = Array.from(duplicateMap.entries())
    .map(([client_slug, { total, duplicates }]) => ({
      client_slug,
      total,
      duplicates,
      rate: total > 0 ? Math.round((duplicates / total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate)

  return NextResponse.json({
    utm_source: toSortedUtm(utmMaps.utm_source),
    utm_medium: toSortedUtm(utmMaps.utm_medium),
    utm_campaign: toSortedUtm(utmMaps.utm_campaign),
    duplicate_rates,
    total_leads: totalLeads,
    total_duplicates: totalDuplicates,
  } satisfies AnalyticsResponse)
}
