import { verifySession } from '@/lib/session'
import { NextResponse } from 'next/server'

/**
 * Auth guard for API routes.
 * Returns null if authenticated, or a 401 NextResponse if not.
 *
 * verifySession() calls redirect('/login') on failure which throws a
 * NEXT_REDIRECT error — catching it returns 401 instead of an unhandled redirect.
 *
 * Usage:
 *   const unauth = await requireAuth()
 *   if (unauth) return unauth
 */
export async function requireAuth(): Promise<NextResponse | null> {
  try {
    await verifySession()
    return null
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
