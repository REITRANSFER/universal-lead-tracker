import { createSession } from '@/lib/session'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const dashboardPassword = process.env.DASHBOARD_PASSWORD
  if (!dashboardPassword) {
    return NextResponse.json(
      { error: 'Server misconfigured — DASHBOARD_PASSWORD not set' },
      { status: 503 }
    )
  }

  const body = await req.json().catch(() => null)
  if (!body?.password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  if (body.password !== dashboardPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  await createSession()
  return NextResponse.json({ ok: true })
}
