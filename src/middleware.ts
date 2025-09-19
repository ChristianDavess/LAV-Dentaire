import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth-edge'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/patients',
  '/appointments',
  '/treatments',
  '/analytics',
  '/profile',
  '/settings'
]

// Define public routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.includes(pathname)

  // If it's a protected route and no token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If it's a protected route and token exists, verify the token
  if (isProtectedRoute && token) {
    try {
      const payload = verifyTokenEdge(token)

      // If token is invalid, redirect to login
      if (!payload) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth-token')
        return response
      }
    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }

  // If it's an auth route and user is authenticated, redirect to dashboard
  if (isAuthRoute && token) {
    const payload = verifyTokenEdge(token)

    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // For root path, redirect to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    if (token && verifyTokenEdge(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - patient-registration (QR code registration - public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|patient-registration).*)',
  ],
}