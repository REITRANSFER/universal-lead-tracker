import 'server-only'
import { encrypt, decrypt } from './auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export { encrypt, decrypt }

export async function createSession() {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ authenticated: true })
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)
  if (!session?.authenticated) {
    redirect('/login')
  }
  return { authenticated: true, expiresAt: session.exp }
})

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
