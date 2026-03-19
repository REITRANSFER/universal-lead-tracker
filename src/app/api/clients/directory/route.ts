import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

/**
 * GET /api/clients/directory
 *
 * Returns all clients with lead counts for the Clients page.
 */
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  // Fetch all clients
  const clientsRes = await supabaseRest(
    '/rest/v1/clients?select=client_slug,name,is_active,domain,crm_type,survey_version&order=name.asc'
  )
  if (!clientsRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 502 })
  }
  const clients = await clientsRes.json()

  // Fetch lead counts grouped by client_slug
  // PostgREST doesn't support GROUP BY, so fetch all client_slugs and count in JS
  const countsRes = await supabaseRest(
    '/rest/v1/leads?select=client_slug'
  )

  const countMap: Record<string, number> = {}
  if (countsRes.ok) {
    const leads: { client_slug: string }[] = await countsRes.json()
    for (const lead of leads) {
      countMap[lead.client_slug] = (countMap[lead.client_slug] ?? 0) + 1
    }
  }

  // Merge
  const result = clients.map((c: Record<string, unknown>) => ({
    client_slug: c.client_slug,
    name: c.name,
    is_active: c.is_active ?? true,
    domain: c.domain ?? null,
    crm_type: c.crm_type ?? null,
    survey_version: c.survey_version ?? null,
    lead_count: countMap[c.client_slug as string] ?? 0,
  }))

  return NextResponse.json(result)
}
