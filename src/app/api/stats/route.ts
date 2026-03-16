import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

interface LeadRow {
  client_slug: string
  received_at: string
  is_duplicate: boolean | null
}

interface ClientCount {
  client_slug: string
  count: number
  duplicate_count: number
}

interface HeatmapCell {
  /** "__all__" for the aggregate row, or a specific client_slug */
  client_slug: string
  /** ISO date string YYYY-MM-DD */
  date: string
  count: number
}

interface StatsResponse {
  clientCounts: ClientCount[]
  topPerformer: ClientCount | null
  /** 7-column (weekday) × N-row heatmap grid, ordered oldest → newest */
  heatmap: HeatmapCell[]
  total_duplicates: number
}

/**
 * GET /api/stats
 *
 * Returns aggregated stats for the dashboard header / heatmap.
 *
 * Query params:
 *   from  - ISO date string (start of range)
 *   to    - ISO date string (end of range)
 *
 * Response: { clientCounts, topPerformer, heatmap }
 */
export async function GET(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Build query — fetch only what we need for aggregation
  const params = new URLSearchParams()
  params.set('select', 'client_slug,received_at,is_duplicate')

  if (from && to) {
    params.set('and', `(received_at.gte.${from},received_at.lte.${to})`)
  } else if (from) {
    params.set('received_at', `gte.${from}`)
  } else if (to) {
    params.set('received_at', `lte.${to}`)
  }

  // Fetch all rows for the period (no pagination — just the two lightweight fields)
  const res = await supabaseRest(`/rest/v1/leads?${params.toString()}`, {
    headers: { Prefer: 'count=exact' },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[/api/stats] Supabase error:', res.status, body)
    return NextResponse.json(
      { error: 'Failed to fetch stats', detail: body },
      { status: 502 }
    )
  }

  const rows: LeadRow[] = await res.json()

  // -------------------------------------------------------------------
  // Compute client counts (including duplicate tracking)
  // -------------------------------------------------------------------
  const countMap = new Map<string, { count: number; dupCount: number }>()
  for (const row of rows) {
    const cur = countMap.get(row.client_slug) ?? { count: 0, dupCount: 0 }
    cur.count++
    if (row.is_duplicate === true) cur.dupCount++
    countMap.set(row.client_slug, cur)
  }

  const clientCounts: ClientCount[] = Array.from(countMap.entries())
    .map(([client_slug, { count, dupCount }]) => ({
      client_slug,
      count,
      duplicate_count: dupCount,
    }))
    .sort((a, b) => b.count - a.count)

  const topPerformer = clientCounts[0] ?? null

  // -------------------------------------------------------------------
  // Build heatmap grid — one cell per calendar day
  // -------------------------------------------------------------------
  // Aggregate map: date → total count across all clients
  const dayMap = new Map<string, number>()
  // Per-client map: client_slug → (date → count)
  const clientDayMap = new Map<string, Map<string, number>>()

  for (const row of rows) {
    if (!row.received_at) continue
    try {
      const date = row.received_at.slice(0, 10) // YYYY-MM-DD
      // Aggregate row
      dayMap.set(date, (dayMap.get(date) ?? 0) + 1)
      // Per-client row
      const slug = row.client_slug
      if (!clientDayMap.has(slug)) {
        clientDayMap.set(slug, new Map<string, number>())
      }
      const clientMap = clientDayMap.get(slug)!
      clientMap.set(date, (clientMap.get(date) ?? 0) + 1)
    } catch {
      // skip malformed dates
    }
  }

  // Build heatmap: aggregate cells (client_slug = "__all__") + per-client cells
  const aggregateCells: HeatmapCell[] = Array.from(dayMap.entries())
    .map(([date, count]) => ({ client_slug: '__all__', date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const perClientCells: HeatmapCell[] = []
  for (const [slug, dateMap] of Array.from(clientDayMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    for (const [date, count] of Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      perClientCells.push({ client_slug: slug, date, count })
    }
  }

  const heatmap: HeatmapCell[] = [...aggregateCells, ...perClientCells]

  const total_duplicates = rows.filter((r) => r.is_duplicate === true).length

  const result: StatsResponse = {
    clientCounts,
    topPerformer,
    heatmap,
    total_duplicates,
  }

  return NextResponse.json(result)
}
