import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { supabaseRest } from '@/lib/supabase'

/**
 * PATCH /api/leads/[id]
 *
 * Updates is_starred or is_flagged on a single lead.
 *
 * Body: { is_starred?: boolean } | { is_flagged?: boolean }
 *
 * Response: the updated lead row
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing lead id' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Only allow updating star/flag fields
  const allowed: Record<string, unknown> = {}
  if (typeof body.is_starred === 'boolean') allowed.is_starred = body.is_starred
  if (typeof body.is_flagged === 'boolean') allowed.is_flagged = body.is_flagged

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update (allowed: is_starred, is_flagged)' },
      { status: 400 }
    )
  }

  const res = await supabaseRest(`/rest/v1/leads?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(allowed),
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[/api/leads/[id]] PATCH error:', res.status, body)
    return NextResponse.json(
      { error: 'Failed to update lead', detail: body },
      { status: 502 }
    )
  }

  const rows = await res.json()
  const updated = Array.isArray(rows) ? rows[0] : rows

  if (!updated) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
