import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

interface ClientAdSpendRow {
  client_slug: string
  name: string | null
  daily_budget: number | null
  spend_7d: number | null
  cpl_7d: number | null
  leads_7d: number | null
  ad_status: string | null
  budget_updated_at: string | null
}

export interface AdSpendEntry {
  client_slug: string
  name: string
  daily_budget: number
  spend_7d: number
  avg_daily_spend: number
  cpl_7d: number
  leads_7d: number
  ad_status: string
  budget_pct: number
  is_under_budget: boolean
  budget_updated_at: string | null
}

/**
 * GET /api/ad-spend
 *
 * Returns ad spend data for clients with budget data.
 * Sorted by budget_pct ascending (worst performers first).
 */
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const res = await supabaseRest(
    '/rest/v1/clients?select=client_slug,name,daily_budget,spend_7d,cpl_7d,leads_7d,ad_status,budget_updated_at&daily_budget=not.is.null&order=daily_budget.desc'
  )

  if (!res.ok) {
    const detail = await res.text()
    console.error('[/api/ad-spend] Supabase error:', detail)
    return NextResponse.json(
      { error: 'Failed to fetch ad spend data', detail },
      { status: 502 }
    )
  }

  const rows: ClientAdSpendRow[] = await res.json()

  const entries: AdSpendEntry[] = rows.map((row) => {
    const dailyBudget = row.daily_budget ?? 0
    const spend7d = row.spend_7d ?? 0
    const avgDailySpend = spend7d / 7
    const budgetPct = dailyBudget > 0 ? (avgDailySpend / dailyBudget) * 100 : 0

    return {
      client_slug: row.client_slug,
      name: row.name ?? row.client_slug,
      daily_budget: dailyBudget,
      spend_7d: spend7d,
      avg_daily_spend: Math.round(avgDailySpend * 100) / 100,
      cpl_7d: row.cpl_7d ?? 0,
      leads_7d: row.leads_7d ?? 0,
      ad_status: row.ad_status ?? 'unknown',
      budget_pct: Math.round(budgetPct * 10) / 10,
      is_under_budget: budgetPct < 80,
      budget_updated_at: row.budget_updated_at,
    }
  })

  // Sort by budget_pct ascending — worst performers first
  entries.sort((a, b) => a.budget_pct - b.budget_pct)

  return NextResponse.json(entries)
}
