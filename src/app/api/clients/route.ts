import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

/**
 * GET /api/clients
 *
 * Returns all clients sorted by name for use in the filter dropdown.
 *
 * Response: Array<{ client_slug: string; name: string }>
 */
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const res = await supabaseRest(
    '/rest/v1/clients?select=client_slug,name,survey_version&order=name.asc'
  )

  if (!res.ok) {
    const body = await res.text()
    console.error('[/api/clients] Supabase error:', res.status, body)
    return NextResponse.json(
      { error: 'Failed to fetch clients', detail: body },
      { status: 502 }
    )
  }

  const clients = await res.json()
  return NextResponse.json(clients)
}
