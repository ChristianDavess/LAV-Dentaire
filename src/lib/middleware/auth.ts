import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-local'
import { ApiError } from '@/types/api'

// Authentication middleware for API routes
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any, ...args: any[]) => Promise<NextResponse>,
  ...args: any[]
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' } as ApiError,
        { status: 401 }
      )
    }

    const user = await getCurrentUser(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' } as ApiError,
        { status: 401 }
      )
    }

    // Call the actual handler with the authenticated user
    return await handler(request, user, ...args)
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' } as ApiError,
      { status: 401 }
    )
  }
}

// Optional authentication middleware (allows unauthenticated access)
export async function withOptionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, user?: any, ...args: any[]) => Promise<NextResponse>,
  ...args: any[]
): Promise<NextResponse> {
  try {
    const token = request.cookies.get('auth-token')?.value
    let user = null

    if (token) {
      user = await getCurrentUser(token)
    }

    // Call the handler with user (which might be null)
    return await handler(request, user, ...args)
  } catch (error) {
    console.error('Optional authentication middleware error:', error)
    // In case of auth error, proceed without user
    return await handler(request, null, ...args)
  }
}