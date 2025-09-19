import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-local'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth/login', '/api/setup-database']

  // Patient registration routes (QR code based)
  const patientRegistrationRoutes = ['/patient-registration']

  // Check if it's a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if it's a patient registration route
  if (patientRegistrationRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // For all other routes, check authentication
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // Redirect to login with the current URL as redirect parameter
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const payload = verifyToken(token)
  if (!payload) {
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  // Token is valid, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}