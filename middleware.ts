import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'

const PROTECTED_PREFIXES = ['/dashboard', '/org']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const requiresAuth = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!requiresAuth) return NextResponse.next()

  const token = request.cookies.get(AUTH_COOKIE)?.value
  const user = token ? await verifyToken(token) : null

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
