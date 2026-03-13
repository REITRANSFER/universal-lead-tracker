import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/auth'

const publicRoutes = ['/login']

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Allow public routes and auth API
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  // Gate 1: optimistic session check (CVE-2025-29927 mitigation — layout is Gate 2)
  const sessionCookie = req.cookies.get('session')?.value
  const session = await decrypt(sessionCookie)

  if (!session?.authenticated) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
